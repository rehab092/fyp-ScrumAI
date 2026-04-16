# Generated migration for taskalloactionhelper models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('assignment_module', '0001_initial'),
        ('userstorymanager', '0001_initial'),
        ('sprintmanager', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskSuggestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('skill_match_score', models.FloatField(default=0)),
                ('capacity_score', models.FloatField(default=0)),
                ('workload_score', models.FloatField(default=0)),
                ('experience_score', models.FloatField(default=0)),
                ('blocker_score', models.FloatField(default=0)),
                ('urgency_score', models.FloatField(default=0)),
                ('overall_rank', models.FloatField(default=0)),
                ('skill_match_details', models.JSONField(blank=True, default=dict)),
                ('alternative_developers', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('MANUALLY_CHANGED', 'Manually Changed')], default='PENDING', max_length=50)),
                ('suggested_at', models.DateTimeField(auto_now_add=True)),
                ('sm_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('change_reason', models.TextField(blank=True, null=True)),
                ('manually_assigned_to_fk', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='manual_assignments_received', to='assignment_module.teammember')),
                ('sm_reviewed_by_fk', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_suggestions', to='assignment_module.managementuser')),
                ('sprint_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_suggestions', to='sprintmanager.sprint')),
                ('suggested_developer_fk', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='suggestions_received', to='assignment_module.teammember')),
                ('task_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='suggestions', to='userstorymanager.backlog')),
                ('workspace_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_suggestions', to='assignment_module.adminworkspace')),
            ],
            options={
                'ordering': ['-overall_rank'],
                'unique_together': {('sprint_fk', 'task_fk')},
            },
        ),
        migrations.CreateModel(
            name='DeveloperWorkload',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_capacity_hours', models.FloatField(default=0)),
                ('assigned_hours', models.FloatField(default=0)),
                ('completed_hours', models.FloatField(default=0)),
                ('in_progress_hours', models.FloatField(default=0)),
                ('available_hours', models.FloatField(default=0)),
                ('utilization_percentage', models.FloatField(default=0)),
                ('active_tasks', models.JSONField(blank=True, default=list)),
                ('blocked_tasks', models.JSONField(blank=True, default=list)),
                ('delayed_tasks', models.JSONField(blank=True, default=list)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('developer_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workload_history', to='assignment_module.teammember')),
                ('sprint_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='developer_workloads', to='sprintmanager.sprint')),
                ('workspace_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='developer_workloads', to='assignment_module.adminworkspace')),
            ],
            options={
                'unique_together': {('developer_fk', 'sprint_fk')},
            },
        ),
        migrations.CreateModel(
            name='TicketStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('old_status', models.CharField(blank=True, choices=[('TO_DO', 'To Do'), ('IN_PROGRESS', 'In Progress'), ('BLOCKED', 'Blocked'), ('DONE', 'Done'), ('DELAYED', 'Delayed')], max_length=20, null=True)),
                ('new_status', models.CharField(choices=[('TO_DO', 'To Do'), ('IN_PROGRESS', 'In Progress'), ('BLOCKED', 'Blocked'), ('DONE', 'Done'), ('DELAYED', 'Delayed')], max_length=20)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('reason', models.TextField(blank=True, help_text='Why was status changed', null=True)),
                ('progress_percentage', models.IntegerField(blank=True, null=True)),
                ('changed_by_fk', models.ForeignKey(blank=True, help_text='Developer who made the status change', null=True, on_delete=django.db.models.deletion.SET_NULL, to='assignment_module.teammember')),
                ('sprint_fk', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ticket_status_history', to='sprintmanager.sprint')),
                ('task_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='userstorymanager.backlog')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='AssignmentApprovalWorkflow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_status', models.CharField(choices=[('SM_PENDING', 'SM Pending'), ('SM_APPROVED', 'SM Approved'), ('SM_REJECTED', 'SM Rejected'), ('DEV_PENDING', 'DEV Pending'), ('DEV_ACCEPTED', 'DEV Accepted'), ('DEV_REJECTED', 'DEV Rejected'), ('ACTIVE', 'Active'), ('CANCELLED', 'Cancelled')], default='SM_PENDING', max_length=50)),
                ('sm_review_timestamp', models.DateTimeField(blank=True, null=True)),
                ('sm_approval_notes', models.TextField(blank=True, null=True)),
                ('developer_notification_sent', models.DateTimeField(blank=True, null=True)),
                ('developer_response_timestamp', models.DateTimeField(blank=True, null=True)),
                ('developer_response', models.CharField(blank=True, choices=[('ACCEPT', 'Accept'), ('REJECT', 'Reject')], max_length=10, null=True)),
                ('developer_rejection_reason', models.TextField(blank=True, null=True)),
                ('alternative_suggestions_generated', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('sm_approved_developer_fk', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sm_approvals', to='assignment_module.teammember')),
                ('task_suggestion_fk', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='approval_workflow', to='taskalloactionhelper.tasksuggestion')),
                ('workspace_fk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approval_workflows', to='assignment_module.adminworkspace')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='tasksuggestion',
            index=models.Index(fields=['sprint_fk', 'status'], name='tasugg_sprint_status_idx'),
        ),
        migrations.AddIndex(
            model_name='tasksuggestion',
            index=models.Index(fields=['workspace_fk', 'status'], name='tasugg_workspace_status_idx'),
        ),
        migrations.AddIndex(
            model_name='developerworkload',
            index=models.Index(fields=['sprint_fk', 'utilization_percentage'], name='devwork_sprint_util_idx'),
        ),
        migrations.AddIndex(
            model_name='ticketstatushistory',
            index=models.Index(fields=['task_fk', '-timestamp'], name='tickstat_task_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='ticketstatushistory',
            index=models.Index(fields=['sprint_fk', '-timestamp'], name='tickstat_sprint_timestamp_idx'),
        ),
    ]
