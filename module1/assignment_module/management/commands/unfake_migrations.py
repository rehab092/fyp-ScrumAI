from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Unfake assignment_module migrations to recreate missing tables'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Remove all migrations from dependent apps
            cursor.execute(
                "DELETE FROM django_migrations WHERE app IN ('userstorymanager', 'sprintmanager', 'taskdependency', 'delayalerts')"
            )
            self.stdout.write(self.style.SUCCESS('Cleared dependent app migration history'))
            
            # Remove all assignment_module migrations from the history
            cursor.execute(
                "DELETE FROM django_migrations WHERE app = 'assignment_module'"
            )
            self.stdout.write(self.style.SUCCESS('Cleared assignment_module migration history'))
            
        self.stdout.write(self.style.SUCCESS('Ready to re-apply migrations and create tables'))
