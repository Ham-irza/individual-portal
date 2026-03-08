"""Populate China Visa & Business Registration service types and requirements."""

from django.db import migrations


def create_china_visa_services(apps, schema_editor):
    """Create China visa service types and their document requirements."""
    ServiceType = apps.get_model('documents', 'ServiceType')
    RequiredDocument = apps.get_model('documents', 'RequiredDocument')
    
    # China Visa & Business Registration Document Requirements
    china_services = {
        'china_business_registration': {
            'name': 'China Business Registration',
            'description': 'Used when a client wants to register a company/business in China.',
            'requirements': [
                {'title': 'Company Name', 'optional': False, 'notes': 'Required for business registration'},
                {'title': 'Business Scope (description of activities)', 'optional': False, 'notes': 'Description of activities the company will perform'},
                {'title': 'Email Address', 'optional': False, 'notes': 'Contact email for business registration'},
                {'title': 'Phone Number', 'optional': False, 'notes': 'Contact phone for business registration'},
                {'title': 'Passport Bio Page (clear scan)', 'optional': False, 'notes': 'Clear scan of the passport information page, minimum 300 DPI'},
                {'title': 'Introduction Video', 'optional': False, 'notes': 'Short video introducing the applicant and business purpose'},
            ]
        },
        'china_work_visa_z': {
            'name': 'China Work Visa (Z Visa)',
            'description': 'Issued to foreign nationals who intend to work legally in China.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'Professional Certificate or Degree Certificate', 'optional': False, 'notes': 'Proof of professional qualifications'},
                {'title': 'Experience Letter (proof of previous employment)', 'optional': False, 'notes': 'Proof of previous employment experience'},
                {'title': 'Medical Examination File', 'optional': False, 'notes': 'Official medical examination report'},
                {'title': 'Police Non-Criminal Certificate (background check)', 'optional': False, 'notes': 'Background check certificate, issued within last 6 months'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Any Additional Supporting Documents', 'optional': True, 'notes': 'Additional documents as requested by authorities'},
            ]
        },
        'china_business_visa_m': {
            'name': 'China Business Visa (M Visa)',
            'description': 'Issued to individuals traveling to China for business activities such as trade, meetings, supplier visits, or negotiations.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Company License (of inviting company)', 'optional': False, 'notes': 'Business license of the Chinese company inviting the applicant'},
                {'title': 'Police Non-Criminal Certificate', 'optional': False, 'notes': 'Background check certificate, issued within last 6 months'},
                {'title': 'Hotel Booking Confirmation', 'optional': False, 'notes': 'Confirmed hotel reservation for the stay in China'},
                {'title': 'Flight Ticket / Travel Itinerary', 'optional': False, 'notes': 'Confirmed flight booking or detailed travel itinerary'},
                {'title': 'Email Address', 'optional': False, 'notes': 'Contact email address'},
                {'title': 'Phone Number', 'optional': False, 'notes': 'Contact phone number'},
                {'title': 'Last Entry to China (date or visa copy if applicable)', 'optional': True, 'notes': 'Previous China visa or entry stamp if applicable'},
            ]
        },
        'china_canton_fair_visa': {
            'name': 'China Canton Fair Visa',
            'description': 'Visa for individuals attending the Canton Fair (China Import and Export Fair) for business and trade purposes.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Business Card', 'optional': False, 'notes': 'Professional business card'},
                {'title': 'Email Address', 'optional': False, 'notes': 'Contact email address'},
                {'title': 'Phone Number', 'optional': False, 'notes': 'Contact phone number'},
                {'title': 'Last Entry to China (if any)', 'optional': True, 'notes': 'Previous China visa or entry stamp if applicable'},
            ]
        },
        'china_tourist_visa_l': {
            'name': 'China Tourist Visa (L Visa)',
            'description': 'Issued to individuals visiting China for tourism, sightseeing, or personal travel.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Police Non-Criminal Certificate', 'optional': False, 'notes': 'Background check certificate, issued within last 6 months'},
                {'title': 'Email Address', 'optional': False, 'notes': 'Contact email address'},
                {'title': 'Phone Number', 'optional': False, 'notes': 'Contact phone number'},
                {'title': 'Last Entry to China (if any)', 'optional': True, 'notes': 'Previous China visa or entry stamp if applicable'},
            ]
        },
        'china_medical_health_tourism_visa': {
            'name': 'China Medical / Health Tourism Visa',
            'description': 'For individuals traveling to China for medical treatment or health-related services.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Medical Reports (diagnosis, treatment records)', 'optional': False, 'notes': 'Official medical diagnosis and treatment records'},
                {'title': 'Email Address', 'optional': False, 'notes': 'Contact email address'},
                {'title': 'Phone Number', 'optional': False, 'notes': 'Contact phone number'},
                {'title': 'Last Entry to China (if any)', 'optional': True, 'notes': 'Previous China visa or entry stamp if applicable'},
            ]
        },
        'china_family_visa': {
            'name': 'China Family Visa',
            'description': 'Visa issued to family members of individuals working or residing in China.',
            'requirements': [
                {'title': 'Passport Bio Page', 'optional': False, 'notes': 'Clear scan of passport information page, minimum 300 DPI'},
                {'title': 'Professional Certificate / Degree Certificate (of sponsor if required)', 'optional': False, 'notes': 'Professional qualifications of the sponsor in China'},
                {'title': 'Experience Letter', 'optional': False, 'notes': 'Employment verification letter from sponsor'},
                {'title': 'Medical Examination File', 'optional': False, 'notes': 'Official medical examination report'},
                {'title': 'Police Non-Criminal Certificate', 'optional': False, 'notes': 'Background check certificate, issued within last 6 months'},
                {'title': 'White Background Passport Photo', 'optional': False, 'notes': 'Recent passport photo with white background'},
                {'title': 'Marriage Certificate', 'optional': False, 'notes': 'Marriage certificate for spouse applicants'},
                {'title': 'Baby Birth Certificate (if applicable)', 'optional': False, 'notes': 'Birth certificate for children applicants'},
                {'title': 'Baby Passport and Photo', 'optional': False, 'notes': 'Passport and photo for children applicants'},
                {'title': 'Any Additional Supporting Documents', 'optional': True, 'notes': 'Additional documents as requested by authorities'},
            ]
        },
    }
    
    # Create service types and their requirements
    for service_key, service_data in china_services.items():
        service, created = ServiceType.objects.get_or_create(
            key=service_key,
            defaults={
                'name': service_data['name'],
                'description': service_data['description']
            }
        )
        
        # Clear existing requirements for this service
        RequiredDocument.objects.filter(service=service).delete()
        
        # Create new requirements
        for order, req_data in enumerate(service_data['requirements']):
            RequiredDocument.objects.create(
                service=service,
                title=req_data['title'],
                optional=req_data['optional'],
                notes=req_data['notes'],
                order=order
            )


def remove_china_visa_services(apps, schema_editor):
    """Remove China visa service types and their requirements."""
    ServiceType = apps.get_model('documents', 'ServiceType')
    
    china_service_keys = [
        'china_business_registration',
        'china_work_visa_z',
        'china_business_visa_m',
        'china_canton_fair_visa',
        'china_tourist_visa_l',
        'china_medical_health_tourism_visa',
        'china_family_visa'
    ]
    
    ServiceType.objects.filter(key__in=china_service_keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_china_visa_services, remove_china_visa_services),
    ]