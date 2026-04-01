from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("assignment_module", "0008_remove_managementuser_skills_alter_adminworkspace_id_and_more"),
        ("sprintmanager", "0001_initial"),
        ("userstorymanager", "0002_remove_userstory_text_file_productowner_workspace_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaskProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("IN_PROGRESS", "In Progress"),
                            ("COMPLETED", "Completed"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                ("deadline", models.DateField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "sprint",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="sprintmanager.sprint"),
                ),
                (
                    "task",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="userstorymanager.backlog"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="assignment_module.adminworkspace"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DelayAlert",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "alert_type",
                    models.CharField(
                        choices=[
                            ("DIRECT", "Direct Delay"),
                            ("CASCADE", "Cascade Delay"),
                            ("CHAIN", "Chain Delay"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reason", models.TextField()),
                ("severity", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("detected_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "source_task",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="propagated_delay_alerts",
                        to="userstorymanager.backlog",
                    ),
                ),
                (
                    "sprint",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="sprintmanager.sprint"),
                ),
                (
                    "task",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="delay_alerts", to="userstorymanager.backlog"),
                ),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="assignment_module.adminworkspace"),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="taskprogress",
            constraint=models.UniqueConstraint(
                fields=("workspace", "task", "sprint"),
                name="uniq_task_progress_workspace_task_sprint",
            ),
        ),
        migrations.AddIndex(
            model_name="taskprogress",
            index=models.Index(fields=["workspace", "status"], name="delayalerts__workspac_45aa17_idx"),
        ),
        migrations.AddIndex(
            model_name="taskprogress",
            index=models.Index(fields=["workspace", "deadline"], name="delayalerts__workspac_48d8f9_idx"),
        ),
        migrations.AddIndex(
            model_name="delayalert",
            index=models.Index(fields=["workspace", "is_active"], name="delayalerts__workspac_efb74c_idx"),
        ),
        migrations.AddIndex(
            model_name="delayalert",
            index=models.Index(fields=["workspace", "task", "source_task"], name="delayalerts__workspac_926469_idx"),
        ),
    ]
