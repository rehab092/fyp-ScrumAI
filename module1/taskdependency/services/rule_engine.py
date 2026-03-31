from dataclasses import dataclass
from typing import List


@dataclass
class CandidateDependency:
    predecessor_task_id: int
    successor_task_id: int
    dependency_type: str
    confidence: float
    reason: str
    source: str


def infer_rule_based_dependencies(task_pairs: List[tuple]) -> List[CandidateDependency]:
    """
    Rule baseline. Replace/tune these rules with your checkpoint logic.

    task_pairs item format:
    (task_a_id, task_a_text, task_b_id, task_b_text)
    """
    out: List[CandidateDependency] = []

    setup_keywords = ["setup", "install", "configure", "initialize", "create schema", "migrate"]
    build_keywords = ["implement", "build", "develop", "code"]
    test_keywords = ["test", "qa", "validate", "verify"]

    for task_a_id, task_a_text, task_b_id, task_b_text in task_pairs:
        a = (task_a_text or "").lower()
        b = (task_b_text or "").lower()

        if any(k in a for k in setup_keywords) and any(k in b for k in build_keywords):
            out.append(
                CandidateDependency(
                    predecessor_task_id=task_a_id,
                    successor_task_id=task_b_id,
                    dependency_type="BLOCKS",
                    confidence=0.72,
                    reason="Setup/config task should complete before implementation task.",
                    source="RULE",
                )
            )
            continue

        if any(k in a for k in build_keywords) and any(k in b for k in test_keywords):
            out.append(
                CandidateDependency(
                    predecessor_task_id=task_a_id,
                    successor_task_id=task_b_id,
                    dependency_type="BLOCKS",
                    confidence=0.69,
                    reason="Implementation task should complete before testing task.",
                    source="RULE",
                )
            )

    return out
