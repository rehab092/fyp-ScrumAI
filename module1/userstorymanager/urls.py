from django.urls import path
from . import views
from . import test_llm
from django.urls import path, include
from django.contrib import admin



urlpatterns = [
    path('', views.product_owner_list, name='owner_list'),
    path('create/', views.product_owner_create, name='owner_create'),
    # path('update/<int:pk>/', views.product_owner_update, name='owner_update'),
     path('delete/<int:pk>/', views.product_owner_delete, name='owner_delete'),
    path('login/', views.product_owner_login, name='owner_login'),
    path('create_backlog/', views.upload_user_story, name='upload_user_story'),
    path('create_story/', views.create_story_with_llm, name='create_story_with_llm'),  # Create single story with LLM
    path('tasks/', views.get_all_tasks, name='get_all_tasks'),  #  Get all tasks
    path('tasks/<int:user_story_id>/', views.get_tasks_by_user_story, name='get_tasks_by_user_story'),  # Get tasks for a user story
    path('task/<int:task_id>/update/', views.update_task, name='update_task'),  # Update task
    path('task/<int:task_id>/status/', views.update_task_status, name='update_task_status'),  # Update task status
    path('task/<int:task_id>/delete/', views.delete_task, name='delete_task'),  # Delete task
    path('story/<int:user_story_id>/delete/', views.delete_user_story, name='delete_user_story'),

 path('stories/', views.get_all_userstories, name='get_all_userstories'),
 path('story/<int:user_story_id>/update/', views.update_user_story, name='update_user_story'),
path('owner_by_email/', views.get_product_owner_by_email, name='owner_by_email'),
# Project endpoints
    path('projects/', views.get_all_projects, name='get_all_projects'),  # Get all projects
    path('projects/owner/<int:owner_id>/', views.get_projects_by_owner, name='get_projects_by_owner'),  # Get projects by owner ID
    path('projects/workspace/<int:workspace_id>/', views.get_projects_by_workspace, name='get_projects_by_workspace'),  # Get projects by workspace ID
    path('project/<int:project_id>/update/', views.update_project, name='update_project'),  # Update project
    path('project/<int:project_id>/delete/', views.delete_project, name='delete_project'),  # Delete project
    path('project/create/', views.create_project, name='create_project'),  # Create a new project
    path('project/id_by_name/', views.get_project_id_by_name, name='get_project_id_by_name'),
    path('userstories/owner/<int:owner_id>/', views.get_userstories_by_owner, name='get_userstories_by_owner'),
    path('us/projects/<int:project_id>/stories/', views.get_userstories_by_project, name='get_userstories_by_project'),  # Get user stories by project ID
    path('debug/owner/<int:owner_id>/', views.debug_owner, name='debug_owner'),  # Debug endpoint
    path('debug/all/', views.debug_all, name='debug_all'),  # Debug all data
    path('debug/projects/', views.debug_projects, name='debug_projects'),  # Debug projects ownership
    path('debug/link-projects/', views.link_projects_to_owners, name='link_projects_to_owners'),  # Link orphan projects to owners
    path('debug/seed/<int:owner_id>/', views.seed_test_project, name='seed_test_project'),  # Create test project
    
    # Sprint task management (Product Owner → Scrum Master)
    path('sprint/add-task/', views.add_task_to_sprint, name='add_task_to_sprint'),  # Add task to sprint
    path('sprint/<int:sprint_id>/tasks/', views.get_sprint_tasks, name='get_sprint_tasks'),  # Get all tasks in a sprint
    path('sprint/task/<int:sprint_item_id>/remove/', views.remove_task_from_sprint, name='remove_task_from_sprint'),  # Remove task from sprint

    # Sprint Assignments (Product Owner assigns stories to sprints)
    path('sprint-assignments/save/', views.save_sprint_assignments, name='save_sprint_assignments'),  # Save sprint assignments
    path('sprint-assignments/project/<int:project_id>/', views.get_sprint_assignments, name='get_sprint_assignments'),  # Get assignments by project

    # LLM Test Endpoints
    path('test/llm/', test_llm.test_llm_decomposition, name='test_llm'),
    path('test/llm/batch/', test_llm.test_llm_batch, name='test_llm_batch'),
]