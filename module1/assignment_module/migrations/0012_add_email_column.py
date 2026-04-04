# Generated migration to add email column to TeamMember

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignment_module', '0011_add_workspace_to_teammember'),
    ]

    operations = [
        migrations.AddField(
            model_name='teammember',
            name='email',
            field=models.EmailField(default='', max_length=254, unique=True),
            preserve_default=False,
        ),
    ]
