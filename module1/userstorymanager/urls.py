from django.urls import path
from . import views

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
    
    
    

]