from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userstorymanager', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstory',
            name='story_points',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
