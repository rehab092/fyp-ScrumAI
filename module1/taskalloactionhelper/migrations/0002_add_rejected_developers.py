# Generated migration to add rejected_developers field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('taskalloactionhelper', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tasksuggestion',
            name='rejected_developers',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
