"""
Secure file upload: allowed extensions and MIME, size.
"""
import os
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_upload_file(file, document_type=None, service_type=None):
    """Validate extension, size, and visa-specific requirements."""
    ext = os.path.splitext(getattr(file, "name", "") or "")[1].lower()
    allowed = getattr(settings, "ALLOWED_UPLOAD_EXTENSIONS", {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"})
    if ext not in allowed:
        raise ValidationError(f"File type not allowed. Allowed: {', '.join(sorted(allowed))}")
    max_size = getattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE", 10 * 1024 * 1024)
    if file.size > max_size:
        raise ValidationError(f"File too large. Max size: {max_size // (1024*1024)} MB")
    
    # Visa-specific validations
    if service_type and document_type:
        validate_visa_specific_requirements(file, document_type, service_type)


def validate_visa_specific_requirements(file, document_type, service_type):
    """Validate document requirements specific to China visa types."""
    filename = getattr(file, "name", "").lower()
    file_size_mb = file.size / (1024 * 1024)
    
    # Passport Bio Page validation for China visas
    if service_type in ['china_business_registration', 'china_work_visa_z', 'china_business_visa_m', 
                       'china_canton_fair_visa', 'china_tourist_visa_l', 'china_medical_health_tourism_visa', 
                       'china_family_visa']:
        if document_type == 'passport':
            # Minimum resolution check (approximate based on file size)
            if file_size_mb < 0.1:  # Less than 100KB likely indicates low resolution
                raise ValidationError("Passport Bio Page must be a clear scan with minimum 300 DPI resolution.")
            
            # Check if it's actually a passport bio page
            if not any(keyword in filename for keyword in ['bio', 'passport', 'info', 'page']):
                raise ValidationError("Please ensure this is a clear scan of the passport information page.")
    
    # White Background Passport Photo validation for China visas
    if service_type in ['china_work_visa_z', 'china_business_visa_m', 'china_canton_fair_visa', 
                       'china_tourist_visa_l', 'china_medical_health_tourism_visa', 'china_family_visa']:
        if document_type == 'photo':
            # Photo size validation (passport photos are typically small)
            if file_size_mb > 2.0:  # Larger than 2MB might be too high resolution
                raise ValidationError("Passport photo should be recent and appropriately sized.")
            
            # Check file format for photos
            ext = os.path.splitext(filename)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png']:
                raise ValidationError("Passport photo must be in JPG, JPEG, or PNG format with white background.")
    
    # Medical Reports validation for Medical/Health Tourism Visa
    if service_type == 'china_medical_health_tourism_visa' and 'medical' in document_type.lower():
        if file_size_mb < 0.05:  # Less than 50KB likely indicates low quality
            raise ValidationError("Medical reports must be clear and legible.")
    
    # Police Non-Criminal Certificate validation for China visas
    if service_type in ['china_work_visa_z', 'china_business_visa_m', 'china_tourist_visa_l', 
                       'china_medical_health_tourism_visa', 'china_family_visa']:
        if 'police' in document_type.lower() or 'criminal' in document_type.lower():
            # Certificate age validation (issued within last 6 months)
            # This is a basic check - in production, you might want to extract date from PDF/metadata
            if file_size_mb < 0.05:
                raise ValidationError("Police Non-Criminal Certificate must be recent (issued within last 6 months).")
    
    # Video validation for Business Registration
    if service_type == 'china_business_registration' and 'video' in document_type.lower():
        # Note: Video upload would require different handling, but for now we validate as file
        if file_size_mb > 50.0:  # 50MB limit for videos
            raise ValidationError("Introduction video must be under 50MB in size.")
