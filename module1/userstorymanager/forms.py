from django import forms
from .models import ProductOwner

class ProductOwnerForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = ProductOwner
        fields = ['name', 'email', 'password', 'company_name']