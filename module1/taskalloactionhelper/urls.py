from django.urls import path
from . import views

urlpatterns = [
    # Phase 1: Generate Suggestions
    path('assignments/generate-suggestions/', views.generate_suggestions, name='generate_suggestions'),
    
    # Phase 2: List & Review Suggestions
    path('assignments/suggestions/', views.list_suggestions, name='list_suggestions'),
    path('assignments/suggestion/<int:suggestion_id>/approve/', views.approve_or_modify_suggestion, name='approve_suggestion'),
    path('assignments/rejection-stats/', views.get_rejection_stats, name='get_rejection_stats'),
    
    # Phase 3: Notify Developer
    path('assignments/notify-developer/', views.notify_developer_of_assignment, name='notify_developer'),
    
    # Phase 4: Developer Response
    path('assignments/developer-response/', views.developer_response_to_assignment, name='developer_response'),
    path('assignments/developer-responses/', views.get_developer_responses, name='get_developer_responses'),
    
    # Phase 5: Developer Portal - My Tickets
    path('developer/my-tickets/', views.get_developer_tickets, name='get_developer_tickets'),
    
    # Phase 6: Update Ticket Status
    path('developer/task/<int:task_id>/status/', views.update_ticket_status, name='update_ticket_status'),
    
    # Helper: Get Available Sprints with Tasks
    path('sprints/available/', views.get_available_sprints_with_tasks, name='get_available_sprints'),
    
    # Helper: Get Projects by Workspace
    path('projects/by-workspace/', views.get_projects_by_workspace, name='get_projects_by_workspace'),
    
    # Testing: Fetch Sprint Assignment Data
    path('test/sprint-assignment/', views.test_fetch_sprint_assignment_data, name='test_sprint_assignment'),
    
    # Debug: Check all sprints in workspace
    path('debug/sprints/', views.debug_sprints_in_workspace, name='debug_sprints'),
]
