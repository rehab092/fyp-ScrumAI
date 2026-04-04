from django.core.management.base import BaseCommand
from django.db import connection
from datetime import datetime


class Command(BaseCommand):
    help = 'Mark all migrations as applied in the database'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Get all migration files that exist in the code
            migrations = [
                ('assignment_module', '0001_initial'),
                ('assignment_module', '0002_adminworkspace'),
                ('assignment_module', '0003_teammember_email_teammember_password_invitationtoken'),
                ('assignment_module', '0004_remove_teammember_password_teammember_workspace_and_more'),
                ('assignment_module', '0005_teammember_password_alter_teammember_workspace'),
                ('assignment_module', '0006_alter_teammember_assignedhours_and_more'),
                ('assignment_module', '0007_remove_teammember_role_managementuser'),
                ('assignment_module', '0008_remove_managementuser_skills_alter_adminworkspace_id_and_more'),
                ('assignment_module', '0009_auto_fix_history'),
                ('assignment_module', '0010_remove_notification_workspace_and_more'),
                ('userstorymanager', '0001_initial'),
                ('userstorymanager', '0002_remove_userstory_text_file_productowner_workspace_and_more'),
                ('userstorymanager', '0003_project_workspace_id'),
                ('sprintmanager', '0001_initial'),
                ('sprintmanager', '0002_sprint_project_id'),
                ('taskdependency', '0001_initial'),
                ('taskdependency', '0002_rename_taskdepende_project_5f92c6_idx_taskdepende_project_104a55_idx_and_more'),
                ('delayalerts', '0001_initial'),
                ('delayalerts', '0002_rename_delayalerts__workspac_efb74c_idx_delayalerts_workspa_0861f1_idx_and_more'),
            ]
            
            for app, migration_name in migrations:
                try:
                    cursor.execute(
                        "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, NOW())",
                        [app, migration_name]
                    )
                except Exception:
                    # Skip if migration already exists
                    pass
            
            self.stdout.write(self.style.SUCCESS('Marked all migrations as applied'))

