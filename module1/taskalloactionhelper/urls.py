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
    
    # ==================== ANALYTICS ENDPOINTS ====================
    
    # Sprint Completion Rate
    path('analytics/sprint-completion/', views.get_sprint_completion_rate, name='get_sprint_completion_rate'),
    
    # Completion Trend (Daily/Weekly)
    path('analytics/completion-trend/', views.get_daily_completion_trend, name='get_daily_completion_trend'),
    
    # Productivity Metrics (Estimated vs Actual)
    path('analytics/productivity/', views.get_productivity_metrics, name='get_productivity_metrics'),
    
    # Developer Workload Utilization
    path('analytics/developer-utilization/', views.get_developer_utilization, name='get_developer_utilization'),
    
    # Delayed Tasks
    path('analytics/delayed-tasks/', views.get_delayed_tasks, name='get_delayed_tasks'),
    
    # Product Owner Overview (All Projects)
    path('analytics/po-overview/', views.get_po_analytics_overview, name='get_po_analytics_overview'),
    
    # Multi-Sprint Comparison
    path('analytics/compare-sprints/', views.get_multi_sprint_comparison, name='get_multi_sprint_comparison'),
    
    # ==================== PROJECT ANALYTICS ====================
    
    # Project Statistics
    path('project-analytics/<int:project_id>/stats/', views.get_project_stats, name='get_project_stats'),
    
    # Project User Stories
    path('project-analytics/<int:project_id>/stories/', views.get_project_user_stories, name='get_project_user_stories'),
    
    # All Projects Analytics
    path('project-analytics/all/', views.get_all_projects_analytics, name='get_all_projects_analytics'),
]
