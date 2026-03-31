from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("userstorymanager", "0002_remove_userstory_text_file_productowner_workspace_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaskDependency",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "dependency_type",
                    models.CharField(
                        choices=[("BLOCKS", "Blocks"), ("REQUIRES", "Requires"), ("RELATES", "Relates")],
                        default="BLOCKS",
                        max_length=20,
                    ),
                ),
                ("confidence", models.FloatField(default=0.0)),
                (
                    "source",
                    models.CharField(
                        choices=[("RULE", "Rule"), ("ML", "Machine Learning"), ("HYBRID", "Hybrid")],
                        default="HYBRID",
                        max_length=10,
                    ),
                ),
                ("reason", models.TextField(blank=True, null=True)),
                ("mapper_version", models.CharField(blank=True, max_length=50, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "predecessor_task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="as_predecessor_dependencies",
                        to="userstorymanager.backlog",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="task_dependencies",
                        to="userstorymanager.project",
                    ),
                ),
                (
                    "successor_task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="as_successor_dependencies",
                        to="userstorymanager.backlog",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="taskdependency",
            constraint=models.UniqueConstraint(
                fields=("project", "predecessor_task", "successor_task"),
                name="uniq_project_task_dependency_pair",
            ),
        ),
        migrations.AddIndex(
            model_name="taskdependency",
            index=models.Index(fields=["project"], name="taskdepende_project_5f92c6_idx"),
        ),
        migrations.AddIndex(
            model_name="taskdependency",
            index=models.Index(fields=["project", "dependency_type"], name="taskdepende_project_268745_idx"),
        ),
    ]
