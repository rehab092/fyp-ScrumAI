import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv


def setup_django() -> None:
    # Ensure module1 (project root) is on sys.path so `scrumai.settings` can be imported.
    project_root = Path(__file__).resolve().parents[1]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    load_dotenv(project_root / ".env")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "scrumai.settings")
    import django

    django.setup()


DEPENDENCY_CLASS_INDEX = 1


def load_model_runtime() -> Tuple[object, object, object, object]:
    model_dir = os.getenv("TASK_DEP_MODEL_DIR", "")
    if not model_dir:
        return None, None, None, None

    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except Exception:
        return None, None, None, None

    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        tokenizer = AutoTokenizer.from_pretrained(model_dir)
        model = AutoModelForSequenceClassification.from_pretrained(model_dir)
        model.to(device)
        model.eval()
        return torch, tokenizer, model, device
    except Exception:
        return None, None, None, None


def generate_pairs_from_backlog(backlog_queryset) -> List[Dict]:
    projects: Dict[str, List[Dict]] = {}

    for item in backlog_queryset:
        project_id = item.project_id
        if project_id not in projects:
            projects[project_id] = []
        projects[project_id].append({"task_id": item.task_id, "text": item.tasks})

    pairs: List[Dict] = []

    for project_id, tasks in projects.items():
        tasks = sorted(tasks, key=lambda x: x["task_id"])
        for i in range(len(tasks)):
            for j in range(len(tasks)):
                if i == j:
                    continue
                pairs.append(
                    {
                        "project_id": project_id,
                        "A_task_id": tasks[i]["task_id"],
                        "B_task_id": tasks[j]["task_id"],
                        "A_task_text": str(tasks[i]["text"]),
                        "B_task_text": str(tasks[j]["text"]),
                    }
                )

    return pairs


def predict_batch(pairs: List[Dict], batch_size: int = 64, threshold: float = 0.35) -> List[Dict]:
    results: List[Dict] = []
    torch, tokenizer, model, device = load_model_runtime()

    if not model or not tokenizer or not torch:
        for p in pairs:
            results.append({**p, "ml_probability": 0.0, "ml_prediction": 0, "ml_runtime": "unavailable"})
        return results

    for start in range(0, len(pairs), batch_size):
        batch = pairs[start : start + batch_size]
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
            if getattr(logits, "shape", [0, 0])[-1] >= 2:
                probs = torch.softmax(logits, dim=1)[:, DEPENDENCY_CLASS_INDEX].cpu().numpy()
            else:
                probs = torch.sigmoid(logits.view(-1)).cpu().numpy()

        for i, p in enumerate(batch):
            prob = float(probs[i])
            pred = int(prob >= threshold)
            results.append({**p, "ml_probability": prob, "ml_prediction": pred, "ml_runtime": "ok"})

    return results


def rule_boost(task_a: str, task_b: str) -> Tuple[Optional[int], Optional[str]]:
    a = (task_a or "").lower()
    b = (task_b or "").lower()

    if "design" in a and "implement" in b:
        return 1, "design_to_implement"

    if ("schema" in a or "model" in a) and ("database" in b or "storage" in b):
        return 1, "schema_to_storage"

    if ("api" in a or "backend" in a) and ("frontend" in b or "ui" in b):
        return 1, "backend_to_frontend"

    if ("setup" in a or "configure" in a) and ("test" in b or "testing" in b):
        return 1, "setup_to_test"

    return None, None


def apply_hybrid_logic(results: List[Dict]) -> List[Dict]:
    final_results: List[Dict] = []

    for r in results:
        ml_pred = r["ml_prediction"]
        ml_prob = r["ml_probability"]

        rule_pred, rule_name = rule_boost(r["A_task_text"], r["B_task_text"])

        if ml_pred == 0 or (0.2 <= ml_prob <= 0.6):
            if rule_pred is not None:
                final_pred = rule_pred
                source = rule_name
            else:
                final_pred = ml_pred
                source = "ml_model"
        else:
            final_pred = ml_pred
            source = "ml_model"

        final_results.append({**r, "final_prediction": final_pred, "decision_source": source})

    return final_results


def format_dependencies(final_results: List[Dict]) -> List[Dict]:
    dependencies: List[Dict] = []

    for r in final_results:
        if int(r["final_prediction"]) == 1:
            dependencies.append(
                {
                    "project_id": r["project_id"],
                    "from_task": r["A_task_id"],
                    "to_task": r["B_task_id"],
                    "confidence": r["ml_probability"],
                    "source": r["decision_source"],
                }
            )

    return dependencies


def run(project_id: int, threshold: float, batch_size: int, show_examples: int) -> None:
    setup_django()
    from userstorymanager.models import Backlog

    backlog = Backlog.objects.filter(project_id=str(project_id)).order_by("task_id")
    task_count = backlog.count()

    print(f"TASK_DEP_MODEL_DIR={os.getenv('TASK_DEP_MODEL_DIR', '')}")
    print(f"Project={project_id}, BacklogTasks={task_count}")

    if task_count < 2:
        print("Need at least 2 tasks to compute dependencies.")
        return

    pairs = generate_pairs_from_backlog(backlog)
    print(f"GeneratedPairs={len(pairs)}")

    ml_results = predict_batch(pairs, batch_size=batch_size, threshold=threshold)
    final_results = apply_hybrid_logic(ml_results)
    deps = format_dependencies(final_results)

    ml_positive = sum(1 for r in ml_results if int(r["ml_prediction"]) == 1)
    hybrid_positive = len(deps)
    runtime_state = ml_results[0].get("ml_runtime") if ml_results else "unknown"

    print(f"MLRuntime={runtime_state}")
    print(f"MLPositives={ml_positive}")
    print(f"HybridDependencies={hybrid_positive}")

    if not deps:
        print("No dependencies predicted.")
        return

    print("SampleDependencies:")
    for row in deps[:show_examples]:
        print(row)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Debug ML + Rule dependency pipeline for one project")
    parser.add_argument("--project-id", type=int, required=True, help="Project ID to test")
    parser.add_argument("--threshold", type=float, default=0.35, help="ML threshold")
    parser.add_argument("--batch-size", type=int, default=64, help="ML batch size")
    parser.add_argument("--show", type=int, default=10, help="How many dependency rows to print")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(
        project_id=args.project_id,
        threshold=args.threshold,
        batch_size=args.batch_size,
        show_examples=args.show,
    )
