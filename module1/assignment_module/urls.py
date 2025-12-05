from django.urls import path
from .views import add_team_member

urlpatterns = [
    path("team/add/", add_team_member, name="add_team_member"),
]
