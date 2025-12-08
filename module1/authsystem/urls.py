from django.urls import path
from .views import register_admin

urlpatterns = [
    path("register-admin/", register_admin, name="register_admin"),
   # path("activate/<str:token>/", activate_account, name="activate_account"),
]
