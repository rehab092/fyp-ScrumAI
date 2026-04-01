from datetime import date, timedelta

from django.test import Client
from django.test import TestCase

from assignment_module.models import AdminWorkspace
from delayalerts.models import DelayAlert, TaskProgress
from delayalerts.services.engine import run_delay_engine
from taskdependency.models import TaskDependency
from userstorymanager.models import Backlog, ProductOwner, Project, UserStory


class DelayEngineTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.workspace = AdminWorkspace.objects.create(
            adminName="Admin",
            adminEmail="admin@example.com",
            password="hashed",
            workspaceName="WS",
            companyName="Co",
        )

        self.owner = ProductOwner.objects.create(
            name="Owner",
            email="owner@example.com",
            password="pwd",
            company_name="Co",
            workspace=self.workspace,
        )

        self.project = Project.objects.create(name="Proj", description="", owner=self.owner)
        self.story = UserStory.objects.create(
            owner=self.owner,
            role="User",
            goal="Goal",
            benefit="Benefit",
            priority="High",
            project_name=self.project.name,
            project=self.project,
        )

        self.task_a = Backlog.objects.create(
            project_id=str(self.project.id),
            user_story=self.story,
            tasks="Task A",
            subtasks="-",
        )
        self.task_b = Backlog.objects.create(
            project_id=str(self.project.id),
            user_story=self.story,
            tasks="Task B",
            subtasks="-",
        )

        TaskDependency.objects.create(
            project=self.project,
            predecessor_task=self.task_a,
            successor_task=self.task_b,
            dependency_type="BLOCKS",
            confidence=0.9,
            source="ML",
            reason="test",
        )

    def test_direct_and_cascade_alerts_are_created(self):
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_a,
            status=TaskProgress.STATUS_IN_PROGRESS,
            deadline=date.today() - timedelta(days=1),
        )
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_b,
            status=TaskProgress.STATUS_PENDING,
            deadline=date.today() + timedelta(days=2),
        )

        result = run_delay_engine(workspace_id=self.workspace.id)

        self.assertEqual(result["direct_delayed_tasks"], 1)
        self.assertEqual(result["propagated_delays_created"], 1)

        direct_count = DelayAlert.objects.filter(task=self.task_a, alert_type=DelayAlert.TYPE_DIRECT).count()
        cascade_count = DelayAlert.objects.filter(task=self.task_b, alert_type=DelayAlert.TYPE_CASCADE).count()

        self.assertEqual(direct_count, 1)
        self.assertEqual(cascade_count, 1)

    def test_project_delay_context_endpoint(self):
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_a,
            status=TaskProgress.STATUS_IN_PROGRESS,
            deadline=date.today() - timedelta(days=1),
        )
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_b,
            status=TaskProgress.STATUS_PENDING,
            deadline=date.today() + timedelta(days=1),
        )

        response = self.client.get(
            f"/api/delay-alerts/project/{self.project.id}/context/",
            **{"HTTP_WORKSPACE_ID": str(self.workspace.id)},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["projectId"], self.project.id)
        self.assertEqual(payload["summary"]["taskCount"], 2)
        self.assertEqual(payload["summary"]["delayedCount"], 1)

        delayed = [t for t in payload["tasks"] if t["taskId"] == self.task_a.task_id][0]
        blocked = [t for t in payload["tasks"] if t["taskId"] == self.task_b.task_id][0]

        self.assertTrue(delayed["isDelayed"])
        self.assertEqual(blocked["rootCauseTaskId"], self.task_a.task_id)

    def test_completed_task_resolves_existing_active_delay(self):
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_a,
            status=TaskProgress.STATUS_IN_PROGRESS,
            deadline=date.today() - timedelta(days=1),
        )

        first_run = run_delay_engine(workspace_id=self.workspace.id)
        self.assertEqual(first_run["direct_delayed_tasks"], 1)
        self.assertEqual(
            DelayAlert.objects.filter(task=self.task_a, alert_type=DelayAlert.TYPE_DIRECT, is_active=True).count(),
            1,
        )

        progress = TaskProgress.objects.get(workspace=self.workspace, task=self.task_a)
        progress.status = TaskProgress.STATUS_COMPLETED
        progress.save(update_fields=["status", "updated_at"])

        second_run = run_delay_engine(workspace_id=self.workspace.id)
        self.assertGreaterEqual(second_run["resolved_completed_task_alerts"], 1)
        self.assertEqual(
            DelayAlert.objects.filter(task=self.task_a, alert_type=DelayAlert.TYPE_DIRECT, is_active=True).count(),
            0,
        )

    def test_engine_runs_with_placeholder_defaults_without_task_progress(self):
        response = self.client.post(
            "/api/delay-alerts/engine/run/",
            data={
                "defaultStatus": "PENDING",
                "defaultDeadline": (date.today() - timedelta(days=1)).isoformat(),
            },
            content_type="application/json",
            **{"HTTP_WORKSPACE_ID": str(self.workspace.id)},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["result"]["tracked_tasks"], 2)
        self.assertEqual(payload["result"]["direct_delayed_tasks"], 2)

    def test_alerts_endpoint_supports_project_filter_and_project_fields(self):
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_a,
            status=TaskProgress.STATUS_IN_PROGRESS,
            deadline=date.today() - timedelta(days=1),
        )
        run_delay_engine(workspace_id=self.workspace.id)

        response = self.client.get(
            f"/api/delay-alerts/alerts/?active=true&projectId={self.project.id}",
            **{"HTTP_WORKSPACE_ID": str(self.workspace.id)},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertGreaterEqual(len(payload["data"]), 1)
        self.assertEqual(payload["data"][0]["projectId"], str(self.project.id))

    def test_projects_summary_endpoint_returns_expected_fields(self):
        TaskProgress.objects.create(
            workspace=self.workspace,
            task=self.task_a,
            status=TaskProgress.STATUS_IN_PROGRESS,
            deadline=date.today() - timedelta(days=1),
        )
        run_delay_engine(workspace_id=self.workspace.id)

        response = self.client.get(
            "/api/delay-alerts/projects/",
            **{"HTTP_WORKSPACE_ID": str(self.workspace.id)},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertGreaterEqual(len(payload["data"]), 1)

        project_summary = payload["data"][0]
        self.assertEqual(project_summary["projectId"], self.project.id)
        self.assertIn("projectName", project_summary)
        self.assertIn("description", project_summary)
        self.assertIn("activeSprintId", project_summary)
        self.assertEqual(project_summary["taskCount"], 2)
        self.assertGreaterEqual(project_summary["delayedTaskCount"], 1)
        self.assertIn("lastDelay", project_summary)
