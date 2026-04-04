# Add workspace_id column to assignment_module_teammember

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('assignment_module', '0010_remove_notification_workspace_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='teammember',
            name='workspace',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='team_members', to='assignment_module.adminworkspace'),
        ),
    ]
