from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Create missing assignment_module tables'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Create InvitationToken table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assignment_module_invitationtoken (
                    id bigserial primary key,
                    email varchar(254) not null,
                    token varchar(255) unique not null,
                    role varchar(100) not null,
                    is_used boolean default false,
                    created_at timestamp with time zone null,
                    workspace_id bigint not null references assignment_module_adminworkspace(id) on delete cascade
                )
            """)
            self.stdout.write(self.style.SUCCESS('Created InvitationToken table'))
            
            # Create ManagementUser table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assignment_module_managementuser (
                    id bigserial primary key,
                    name varchar(100) not null,
                    email varchar(254) unique not null,
                    password varchar(255) not null,
                    role varchar(20) not null,
                    "createdAt" timestamp with time zone null,
                    "updatedAt" timestamp with time zone null,
                    workspace_id bigint null references assignment_module_adminworkspace(id) on delete cascade
                )
            """)
            self.stdout.write(self.style.SUCCESS('Created ManagementUser table'))
            
        self.stdout.write(self.style.SUCCESS('Missing tables created successfully'))
