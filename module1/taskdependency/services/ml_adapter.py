import os
import re
from dataclasses import dataclass
from typing import List, Optional, Set, Tuple


MODEL_DIR = os.getenv("TASK_DEP_MODEL_DIR", "")
DEFAULT_THRESHOLD = float(os.getenv("TASK_DEP_THRESHOLD", "0.35"))
DEFAULT_BATCH_SIZE = int(os.getenv("TASK_DEP_BATCH_SIZE", "64"))
DEPENDENCY_CLASS_INDEX = 1
NO_DEPENDENCY_CLASS_INDEX = 0

_TORCH = None
_TOKENIZER = None
_MODEL = None
_DEVICE = None


@dataclass
class MLPrediction:
    predecessor_task_id: int
    successor_task_id: int
    dependency_type: str
    confidence: float
    reason: str
    source: str


def _get_ml_runtime() -> Tuple[object, object, object, object]:
    """
    Lazy-load torch + HF model so import does not break environments
    where model files or ML deps are not configured yet.
    """
    global _TORCH, _TOKENIZER, _MODEL, _DEVICE

    if _TORCH is not None and _TOKENIZER is not None and _MODEL is not None and _DEVICE is not None:
        return _TORCH, _TOKENIZER, _MODEL, _DEVICE

    if not MODEL_DIR:
        return None, None, None, None

    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except Exception:
        return None, None, None, None

    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
        model.to(device)
        model.eval()
    except Exception:
        return None, None, None, None

    _TORCH = torch
    _TOKENIZER = tokenizer
    _MODEL = model
    _DEVICE = device
    return _TORCH, _TOKENIZER, _MODEL, _DEVICE


def _rule_boost(task_a: str, task_b: str) -> Tuple[Optional[int], Optional[str]]:
    def normalize_text(text: str) -> str:
        return str(text or "").strip().lower()

    def to_tokens(text: str) -> Set[str]:
        return set(re.findall(r"[a-z0-9_]+", normalize_text(text)))

    def shared_keywords(a_text: str, b_text: str) -> Set[str]:
        stop_words = {
            "the", "a", "an", "and", "or", "to", "for", "of", "in", "on",
            "with", "by", "from", "task", "create", "implement", "design",
            "proceed", "complete", "round", "edit", "edits", "develop", "feature",
            "project", "creation",
        }
        a_words = {w for w in to_tokens(a_text) if w not in stop_words}
        b_words = {w for w in to_tokens(b_text) if w not in stop_words}
        overlap = a_words.intersection(b_words)
        # Ignore numeric-only overlap such as story numbering (e.g., 1, 2, 2_1).
        return {w for w in overlap if not w.isdigit()}

    a = normalize_text(task_a)
    b = normalize_text(task_b)
    a_tokens = to_tokens(a)
    b_tokens = to_tokens(b)
    overlap = shared_keywords(a, b)

    # Rule 1: design -> implement on same topic.
    if "design" in a_tokens and "implement" in b_tokens and len(overlap) >= 1:
        return 1, "rule: design_to_implement"

    # Rule 2: schema/model -> storage/database/table on same topic.
    if (
        ({"schema", "model"} & a_tokens)
        and ({"storage", "database", "table"} & b_tokens)
        and len(overlap) >= 1
    ):
        return 1, "rule: schema_to_storage"

    # Rule 3: API/backend before frontend/ui/integration on same topic.
    if (
        ({"api", "backend"} & a_tokens)
        and ({"frontend", "ui", "integration"} & b_tokens)
        and len(overlap) >= 1
    ):
        return 1, "rule: backend_to_frontend"

    # Rule 4: setup/configure before test on same topic.
    if (
        ({"setup", "configure"} & a_tokens)
        and ({"test", "testing"} & b_tokens)
        and len(overlap) >= 1
    ):
        return 1, "rule: setup_to_test"

    return None, None


def _predict_batch_ml(pairs: List[dict], batch_size: int, threshold: float) -> List[dict]:
    torch, tokenizer, model, device = _get_ml_runtime()

    # If runtime is unavailable, return neutral ML outputs and let rule/hybrid decide.
    if model is None or tokenizer is None or torch is None:
        out = []
        for p in pairs:
            out.append({**p, "ml_probability": 0.0, "ml_prediction": 0})
        return out

    results = []
    for start in range(0, len(pairs), batch_size):
        batch = pairs[start:start + batch_size]

        a_texts = [p["A_task_text"] for p in batch]
        b_texts = [p["B_task_text"] for p in batch]

        enc = tokenizer(
            a_texts,
            b_texts,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt",
        )
        enc = {k: v.to(device) for k, v in enc.items()}

        with torch.no_grad():
            outputs = model(**enc)
            logits = outputs.logits

            # Label mapping locked to your model:
            # class 1 = dependency, class 0 = no dependency.
            if getattr(logits, "shape", [0, 0])[-1] >= 2:
                probs = torch.softmax(logits, dim=1)[:, DEPENDENCY_CLASS_INDEX].cpu().numpy()
            else:
                probs = torch.sigmoid(logits.view(-1)).cpu().numpy()

        for i, p in enumerate(batch):
            prob = float(probs[i])
            pred = int(prob >= threshold)
            results.append({**p, "ml_probability": prob, "ml_prediction": pred})

    return results


def _apply_hybrid_logic(results: List[dict]) -> List[dict]:
    def normalize_text(text: str) -> str:
        return str(text or "").strip().lower()

    def to_tokens(text: str) -> Set[str]:
        return set(re.findall(r"[a-z0-9_]+", normalize_text(text)))

    def shared_keywords(a_text: str, b_text: str) -> Set[str]:
        stop_words = {
            "the", "a", "an", "and", "or", "to", "for", "of", "in", "on",
            "with", "by", "from", "task", "create", "implement", "design",
        }
        a_words = {w for w in to_tokens(a_text) if w not in stop_words}
        b_words = {w for w in to_tokens(b_text) if w not in stop_words}
        return a_words.intersection(b_words)

    def is_ui_edit_task(text: str) -> bool:
        t = str(text or "").strip().lower()
        ui_keywords = {
            "ui",
            "ux",
            "homepage",
            "page",
            "screen",
            "layout",
            "style",
            "styles",
            "css",
            "frontend",
            "help page",
            "edit",
            "edits",
        }
        return any(k in t for k in ui_keywords)

    def is_feature_creation_task(text: str) -> bool:
        t = str(text or "").strip().lower()
        feature_keywords = {
            "feature",
            "develop",
            "development",
            "project creation",
            "create project",
            "implementation",
        }
        return any(k in t for k in feature_keywords)

    final_results = []
    for r in results:
        ml_pred = r["ml_prediction"]
        ml_prob = r["ml_probability"]
        task_a = r["A_task_text"]
        task_b = r["B_task_text"]
        overlap = shared_keywords(task_a, task_b)

        # Guardrail: if both tasks are UI-edit tasks, force no dependency.
        if is_ui_edit_task(task_a) and is_ui_edit_task(task_b):
            final_results.append({**r, "final_prediction": 0, "decision_source": "rule: ui_edit_independent"})
            continue

        # Conservative guardrail: UI-edit task vs feature-creation task should
        # not be treated as dependency.
        if (
            ((is_ui_edit_task(task_a) and is_feature_creation_task(task_b))
             or (is_ui_edit_task(task_b) and is_feature_creation_task(task_a)))
        ):
            final_results.append({**r, "final_prediction": 0, "decision_source": "rule: ui_vs_feature_independent"})
            continue

        rule_pred, rule_name = _rule_boost(task_a, task_b)

        if ml_pred == 0 or (0.2 <= ml_prob <= 0.6):
            if rule_pred is not None:
                final_pred = rule_pred
                decision_source = rule_name
            else:
                final_pred = ml_pred
                decision_source = "ml_model"
        else:
            final_pred = ml_pred
            decision_source = "ml_model"

        final_results.append({**r, "final_prediction": final_pred, "decision_source": decision_source})

    return final_results


def infer_ml_dependencies(task_pairs: List[tuple]) -> List[MLPrediction]:
    """
    task_pairs format: (task_a_id, task_a_text, task_b_id, task_b_text)
    Returns hybrid ML+rule predictions normalized for mapper.
    """
    if not task_pairs:
        return []

    pairs = []
    for a_id, a_text, b_id, b_text in task_pairs:
        pairs.append(
            {
                "A_task_id": a_id,
                "B_task_id": b_id,
                "A_task_text": str(a_text or ""),
                "B_task_text": str(b_text or ""),
            }
        )

    ml_results = _predict_batch_ml(pairs, batch_size=DEFAULT_BATCH_SIZE, threshold=DEFAULT_THRESHOLD)
    final_results = _apply_hybrid_logic(ml_results)

    predictions: List[MLPrediction] = []
    for r in final_results:
        is_dep = int(r.get("final_prediction", 0)) == 1
        decision_source = str(r.get("decision_source") or "ml_model")
        source_tag = "ML" if decision_source == "ml_model" else "HYBRID"

        predictions.append(
            MLPrediction(
                predecessor_task_id=int(r["A_task_id"]),
                successor_task_id=int(r["B_task_id"]),
                dependency_type="BLOCKS" if is_dep else "NONE",
                confidence=float(r.get("ml_probability", 0.0)),
                reason=f"decision_source={decision_source}",
                source=source_tag,
            )
        )

    return predictions
