from django.urls import path
from . import views
from django.urls import path, include
from django.contrib import admin



urlpatterns = [
    path('', views.product_owner_list, name='owner_list'),
    path('create/', views.product_owner_create, name='owner_create'),
    # path('update/<int:pk>/', views.product_owner_update, name='owner_update'),
    # path('delete/<int:pk>/', views.product_owner_delete, name='owner_delete'),
    path('login/', views.product_owner_login, name='owner_login'),
    path('create_backlog/', views.upload_user_story, name='upload_user_story'),
    path('tasks/', views.get_all_tasks, name='get_all_tasks'),  #  Get all tasks
    path('tasks/<int:user_story_id>/', views.get_tasks_by_user_story, name='get_tasks_by_user_story'),  # Get tasks for a user story
    path('task/<int:task_id>/update/', views.update_task, name='update_task'),  # Update task
    path('task/<int:task_id>/delete/', views.delete_task, name='delete_task'),  # Delete task
    path('story/<int:user_story_id>/delete/', views.delete_user_story, name='delete_user_story'),

 path('stories/', views.get_all_userstories, name='get_all_userstories'),
 path('story/<int:user_story_id>/update/', views.update_user_story, name='update_user_story'),
path('owner_by_email/', views.get_product_owner_by_email, name='owner_by_email'),
# Project endpoints
    path('projects/', views.get_all_projects, name='get_all_projects'),  # Get all projects
    path('projects/owner/<int:owner_id>/', views.get_projects_by_owner, name='get_projects_by_owner'),  # Get projects by owner ID
    path('project/<int:project_id>/update/', views.update_project, name='update_project'),  # Update project
    path('project/<int:project_id>/delete/', views.delete_project, name='delete_project'),  # Delete project
    path('project/create/', views.create_project, name='create_project'),  # Create a new project
    

]