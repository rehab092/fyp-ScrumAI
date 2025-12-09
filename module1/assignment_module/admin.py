from django.contrib import admin
from .models import AdminWorkspace

@admin.register(AdminWorkspace)
class AdminWorkspaceAdmin(admin.ModelAdmin):
    list_display = ("adminName", "adminEmail", "workspaceName", "companyName", "createdAt")
    search_fields = ("adminName", "adminEmail", "workspaceName", "companyName")
