from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError

from assignment_module.models import AdminWorkspace
from delayalerts.services.engine import run_delay_engine
from sprintmanager.models import Sprint


STATUS_PENDING = "PENDING"
STATUS_IN_PROGRESS = "IN PROGRESS"
STATUS_COMPLETED = "COMPLETED"


def _normalize_status(value: str) -> str:
    normalized = str(value or "").strip().upper()
    if normalized == "ACTIVE":
        return STATUS_IN_PROGRESS
    if normalized in {"IN_PROGRESS", "IN-PROGRESS", "INPROGRESS"}:
        return STATUS_IN_PROGRESS
    if normalized == "COMPLETED":
        return STATUS_COMPLETED
    return STATUS_PENDING


class Command(BaseCommand):
    help = "Run delay alert engine for one workspace/all workspaces or auto-pick near-deadline sprints."

    def add_arguments(self, parser):
        parser.add_argument("--workspace-id", type=int, help="Run for a specific workspace")
        parser.add_argument("--all-workspaces", action="store_true", help="Run for all workspaces")
        parser.add_argument("--sprint-id", type=int, help="Optional sprint filter")
        parser.add_argument("--run-date", type=str, help="Override date in YYYY-MM-DD")
        parser.add_argument(
            "--default-status",
            type=str,
            default="PENDING",
            help="Fallback status when progress row is missing: PENDING, ACTIVE, COMPLETED",
        )
        parser.add_argument(
            "--default-deadline",
            type=str,
            help="Fallback deadline in YYYY-MM-DD when progress row is missing",
        )
        parser.add_argument(
            "--default-deadline-offset-days",
            type=int,
            help="Fallback deadline offset from run date for missing rows (e.g. -1, 3)",
        )
        parser.add_argument(
            "--near-deadline-days",
            type=int,
            help="Auto-run for active sprints whose end_date is within N days from run date (includes overdue)",
        )

    def handle(self, *args, **options):
        workspace_id = options.get("workspace_id")
        all_workspaces = options.get("all_workspaces")

        if not workspace_id and not all_workspaces:
            raise CommandError("Provide --workspace-id or --all-workspaces")

        if workspace_id and all_workspaces:
            raise CommandError("Use either --workspace-id or --all-workspaces, not both")

        run_date_raw = options.get("run_date")
        run_date = None
        if run_date_raw:
            try:
                run_date = date.fromisoformat(run_date_raw)
            except ValueError as exc:
                raise CommandError("--run-date must be YYYY-MM-DD") from exc

        default_deadline_raw = options.get("default_deadline")
        default_deadline = None
        if default_deadline_raw:
            try:
                default_deadline = date.fromisoformat(default_deadline_raw)
            except ValueError as exc:
                raise CommandError("--default-deadline must be YYYY-MM-DD") from exc

        default_status = _normalize_status(options.get("default_status"))
        default_deadline_offset_days = options.get("default_deadline_offset_days")
        sprint_id = options.get("sprint_id")
        near_deadline_days = options.get("near_deadline_days")

        if sprint_id is not None and near_deadline_days is not None:
            raise CommandError("Use either --sprint-id or --near-deadline-days, not both")

        if workspace_id:
            workspaces = AdminWorkspace.objects.filter(id=workspace_id)
        else:
            workspaces = AdminWorkspace.objects.all().order_by("id")

        if not workspaces.exists():
            raise CommandError("No matching workspace found")

        effective_run_date = run_date or date.today()

        for ws in workspaces:
            if near_deadline_days is not None:
                cutoff = effective_run_date + timedelta(days=near_deadline_days)
                sprints = Sprint.objects.filter(
                    workspace=ws,
                    is_active=True,
                    end_date__lte=cutoff,
                ).order_by("end_date")

                if not sprints.exists():
                    self.stdout.write(
                        self.style.WARNING(
                            f"workspace={ws.id} no active sprint found up to {cutoff.isoformat()}"
                        )
                    )
                    continue

                for sprint in sprints:
                    result = run_delay_engine(
                        workspace_id=ws.id,
                        sprint_id=sprint.id,
                        today=effective_run_date,
                        default_status=default_status,
                        default_deadline=default_deadline,
                        default_deadline_offset_days=default_deadline_offset_days,
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"workspace={ws.id} sprint={sprint.id} end={sprint.end_date.isoformat()} tracked={result['tracked_tasks']} direct={result['direct_delayed_tasks']} propagated={result['propagated_delays_created']}"
                        )
                    )
            else:
                result = run_delay_engine(
                    workspace_id=ws.id,
                    sprint_id=sprint_id,
                    today=run_date,
                    default_status=default_status,
                    default_deadline=default_deadline,
                    default_deadline_offset_days=default_deadline_offset_days,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"workspace={ws.id} tracked={result['tracked_tasks']} direct={result['direct_delayed_tasks']} propagated={result['propagated_delays_created']}"
                    )
                )
