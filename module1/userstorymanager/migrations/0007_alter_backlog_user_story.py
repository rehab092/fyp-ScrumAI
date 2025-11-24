from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('userstorymanager', '0006_fix_backlog_user_story_col'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='backlog',
                    name='user_story',
                    field=models.ForeignKey(
                        to='userstorymanager.userstory',
                        on_delete=models.CASCADE,
                        related_name='backlog_items',
                        db_column='user_story_id',
                    ),
                ),
            ],
            database_operations=[],
        ),
    ]
