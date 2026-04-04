# Generated migration to add password column to TeamMember

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignment_module', '0012_add_email_column'),
    ]

    operations = [
        migrations.AddField(
            model_name='teammember',
            name='password',
            field=models.CharField(default='', max_length=255),
            preserve_default=False,
        ),
    ]
