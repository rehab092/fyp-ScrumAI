from django.urls import path
from . import views

from .views import (
    add_team_member,
    get_team_members,
    get_team_member_by_id,
    update_team_member,
    delete_team_member,
    register_workspace,
    login_admin,
    add_management_user,
    login_user,
    get_scrum_masters,
    get_product_owners,
    # task assignment helpers
     # Developer
    get_my_suggestions,
    accept_assignment,
    reject_assignment,
    get_my_tasks,

    # Scrum Master
    manual_assign_task,
    auto_assign_tasks_ilp,
    get_unassigned_tasks,
    get_sprint_summary,

    # Product Owner
    get_all_assignments,
    get_pending_assignments,
    get_sprint_assignment_overview,

)


urlpatterns = [
    # auth
    path("auth/register-workspace/", register_workspace, name="register_workspace"),
    path("auth/login/", login_admin, name="login_admin"),          # admin only
    path("auth/login-user/", login_user, name="login_user"),        # SM / PO / Dev

    # dev team
    path("team/add/", add_team_member, name="add_team_member"),
    path("team/all/", get_team_members, name="get_team_members"),
    path("team/<int:member_id>/", get_team_member_by_id, name="get_team_member_by_id"),
    path("team/update/<int:member_id>/", update_team_member, name="update_team_member"),
    path("team/delete/<int:member_id>/", delete_team_member, name="delete_team_member"),

    # management roles
    path("roles/add-management-user/", add_management_user, name="add_management_user"),

    path("roles/get-scrum-masters/", get_scrum_masters, name="get_scrum_masters"),
    path("roles/get-product-owners/", get_product_owners, name="get_product_owners"),

# assignment helper

    # SCRUM MASTER ENDPOINTS
    path("assignment/unassigned/<int:sprint_id>/", get_unassigned_tasks, name="get_unassigned_tasks"),

    path("assignment/auto-assign/<int:sprint_id>/", auto_assign_tasks_ilp, name="auto_assign_tasks_ilp"),

    path("assignment/manual/", manual_assign_task, name="manual_assign_task"),

    # DEVELOPER ENDPOINTS
    path("assignment/pending/", get_pending_assignments, name="get_pending_assignments"),

    path("assignment/<int:assignment_id>/accept/", accept_assignment, name="accept_assignment"),
    path("assignment/<int:assignment_id>/reject/", reject_assignment, name="reject_assignment"),

    path("assignment/my-tasks/", get_my_tasks, name="get_my_tasks"),

    # PRODUCT OWNER ENDPOINTS
    path("assignment/sprint/<int:sprint_id>/overview/", get_sprint_assignment_overview,
         name="get_sprint_assignment_overview"),

    path("assignment/sprint/<int:sprint_id>/summary/", get_sprint_summary,
         name="get_sprint_summary"),

    # Suggestion API (already implemented by you)
    path("assignment/my-suggestions/", get_my_suggestions, name="get_my_suggestions"),
  
]
