from rest_framework import serializers
from .models import Document
from .validators import validate_upload_file
from .models import ServiceType, RequiredDocument


class RequiredDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredDocument
        fields = ["id", "service", "title", "optional", "notes", "order"]


class ServiceTypeSerializer(serializers.ModelSerializer):
    requirements = RequiredDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceType
        fields = ["id", "key", "name", "description", "requirements"]


class DocumentSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source="applicant.full_name", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "applicant",
            "applicant_name",
            "document_type",
            "file",
            "original_filename",
            "status",
            "uploaded_at",
            "notes",
        ]
        read_only_fields = ["original_filename", "uploaded_at", "status"]

    def validate_file(self, value):
        # Get service type from applicant's visa_type if available
        applicant = self.initial_data.get('applicant')
        service_type = None
        if applicant:
            try:
                from applicants.models import Applicant
                applicant_obj = Applicant.objects.get(id=applicant)
                service_type = getattr(applicant_obj, 'visa_type', None)
            except Applicant.DoesNotExist:
                pass
        
        document_type = self.initial_data.get('document_type')
        validate_upload_file(value, document_type=document_type, service_type=service_type)
        return value


class DocumentListSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source="applicant.full_name", read_only=True)

    class Meta:
        model = Document
        fields = ["id", "applicant", "applicant_name", "document_type", "status", "uploaded_at", "original_filename", "notes"]


class DocumentStatusSerializer(serializers.ModelSerializer):
    """Admin: update status only."""
    class Meta:
        model = Document
        fields = ["status", "notes"]
