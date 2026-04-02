from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.CreateSprintView.as_view(), name='create_sprint'),
    path('<int:sprint_id>/backlog/', views.SprintBacklogView.as_view(), name='sprint_backlog'),
    path('<int:sprint_id>/add-task/', views.AddTaskView.as_view(), name='add_task'),
    path('<int:sprint_id>/remove-task/<int:task_id>/', views.RemoveTaskView.as_view(), name='remove_task'),
    path('<int:sprint_id>/reoptimize/', views.ReoptimizeSprintView.as_view(), name='reoptimize_sprint'),
]