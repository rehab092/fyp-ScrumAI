from django.urls import path
from .views import get_sprints, get_sprint_items

urlpatterns = [
    path("", get_sprints, name="get_sprints"),
    path("<int:sprint_id>/items/", get_sprint_items, name="get_sprint_items"),
]