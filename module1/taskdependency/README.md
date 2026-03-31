Task Dependency Mapper (scaffold)

Purpose
- Builds pairwise task dependencies from Backlog tasks per project.
- Merges rule-based and ML-based dependency inference.
- Stores dependencies in TaskDependency table for ready-to-view UI.

Current scaffold includes
- Model: TaskDependency
- Service orchestrator: services/mapper.py
- Rule baseline: services/rule_engine.py
- ML adapter placeholder: services/ml_adapter.py
- API views: views.py
- Optional auto trigger signal: signals.py

Important integration steps pending approval
1. Add taskdependency to INSTALLED_APPS.
2. Include taskdependency.urls in root URLs.
3. Decide where auto-trigger should run:
   - Option A: signal on Backlog post_save (already scaffolded).
   - Option B: explicit call after backlog generation in userstorymanager upload flow.

Recommended for your team flow
- Use Option B for deterministic behavior and easier debugging.
- Keep Option A disabled unless you want automatic recompute on every task insert/update.
