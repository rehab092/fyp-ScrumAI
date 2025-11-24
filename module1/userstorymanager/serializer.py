from rest_framework import serializers
from .models import ProductOwner

class ProductOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOwner
        fields = '__all__'