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
    get_product_owners
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

]
