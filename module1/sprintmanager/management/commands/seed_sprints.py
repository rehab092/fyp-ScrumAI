from django.core.management.base import BaseCommand
from sprintmanager.models import Sprint, SprintItem
from assignment_module.models import AdminWorkspace
from userstorymanager.models import Backlog
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = "Seed sprint data for all workspaces"

    def handle(self, *args, **kwargs):
        workspaces = AdminWorkspace.objects.all()

        for ws in workspaces:
            self.stdout.write(f"Creating sprints for workspace: {ws.workspaceName}")

            # Create 2 demo sprints per workspace
            for i in range(1, 3):
                sprint = Sprint.objects.create(
                    workspace=ws,
                    name=f"Sprint {i}",
                    goal="Seeded sprint goal",
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=14)
                )

                # Add 3–5 random tasks to SprintItem
                tasks = list(Backlog.objects.all())
                selected = random.sample(tasks, min(5, len(tasks)))

                for t in selected:
                    SprintItem.objects.create(sprint=sprint, task=t)

                self.stdout.write(f"✔ Sprint {i}: {len(selected)} tasks added")

        self.stdout.write(self.style.SUCCESS("✔ Sprint seeding complete!"))