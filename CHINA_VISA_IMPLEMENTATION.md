# China Visa & Business Registration Document Requirements Implementation

## Overview

This implementation adds comprehensive document requirements specification for China Visa & Business Registration to the existing portal system. The solution includes backend models, validation rules, frontend components, and migration scripts.

## Features Implemented

### 1. New China Visa Types
- **China Business Registration** - For company/business registration in China
- **China Work Visa (Z Visa)** - For foreign nationals working legally in China
- **China Business Visa (M Visa)** - For business activities, trade, meetings
- **China Canton Fair Visa** - For attending the Canton Fair
- **China Tourist Visa (L Visa)** - For tourism and sightseeing
- **China Medical/Health Tourism Visa** - For medical treatment services
- **China Family Visa** - For family members of individuals in China

### 2. Document Requirements System
- **ServiceType Model** - Represents visa types and business registration services
- **RequiredDocument Model** - Defines specific document requirements for each service
- **Document Validation** - Visa-specific validation rules for file uploads
- **Progress Tracking** - Visual progress indicators for document completion

### 3. Frontend Components
- **DocumentRequirements Component** - Displays visa-specific document requirements
- **Progress Visualization** - Shows completion status with percentages
- **Document Status Tracking** - Real-time status updates (Pending, Approved, Rejected)
- **Standard Requirements Display** - Shows general document standards

## Technical Implementation

### Backend Changes

#### Models (`backend/documents/models.py`)
- Updated `SERVICE_DOCUMENTS` with new China visa types
- Added 7 new visa types with their specific document requirements
- Each visa type has tailored document lists with optional/required flags

#### Validation (`backend/documents/validators.py`)
- Enhanced `validate_upload_file()` function with visa-specific rules
- Added `validate_visa_specific_requirements()` for China visa validation
- Implemented file size and resolution checks for different document types
- Added specific validation for:
  - Passport Bio Page (minimum 300 DPI)
  - White Background Passport Photos
  - Medical Reports
  - Police Non-Criminal Certificates
  - Video files for business registration

#### Serializers (`backend/documents/serializers.py`)
- Updated `DocumentSerializer` to use enhanced validation
- Added service type detection from applicant visa_type
- Maintains backward compatibility with existing document uploads

#### Migration (`backend/documents/migrations/0002_populate_china_visa_services.py`)
- Creates new service types and their document requirements
- Populates database with predefined China visa configurations
- Includes detailed notes for each document requirement

### Frontend Changes

#### Document Requirements Component (`src/components/DocumentRequirements.tsx`)
- Fetches service requirements from API
- Displays progress indicators with completion percentages
- Shows document status (Missing, Pending Review, Completed, Rejected)
- Includes standard document requirements section
- Responsive design with hover effects and status indicators

#### Application Detail Integration (`src/pages/ApplicationDetail.tsx`)
- Integrated DocumentRequirements component
- Automatic service key detection from visa type
- Seamless navigation between document upload and requirements view

## Document Requirements by Visa Type

### Business Registration
- Company Name (Required)
- Business Scope (Required)
- Email Address (Required)
- Phone Number (Required)
- Passport Bio Page (Required)
- Introduction Video (Required)

### Work Visa (Z Visa)
- Passport Bio Page (Required)
- Professional Certificate or Degree Certificate (Required)
- Experience Letter (Required)
- Medical Examination File (Required)
- Police Non-Criminal Certificate (Required)
- White Background Passport Photo (Required)
- Additional Supporting Documents (Optional)

### Business Visa (M Visa)
- Passport Bio Page (Required)
- White Background Passport Photo (Required)
- Company License (Required)
- Police Non-Criminal Certificate (Required)
- Hotel Booking Confirmation (Required)
- Flight Ticket/Travel Itinerary (Required)
- Email Address (Required)
- Phone Number (Required)
- Last Entry to China (Optional)

### Canton Fair Visa
- Passport Bio Page (Required)
- White Background Passport Photo (Required)
- Business Card (Required)
- Email Address (Required)
- Phone Number (Required)
- Last Entry to China (Optional)

### Tourist Visa (L Visa)
- Passport Bio Page (Required)
- White Background Passport Photo (Required)
- Police Non-Criminal Certificate (Required)
- Email Address (Required)
- Phone Number (Required)
- Last Entry to China (Optional)

### Medical/Health Tourism Visa
- Passport Bio Page (Required)
- White Background Passport Photo (Required)
- Medical Reports (Required)
- Email Address (Required)
- Phone Number (Required)
- Last Entry to China (Optional)

### Family Visa
- Passport Bio Page (Required)
- Professional Certificate/Degree Certificate (Required)
- Experience Letter (Required)
- Medical Examination File (Required)
- Police Non-Criminal Certificate (Required)
- White Background Passport Photo (Required)
- Marriage Certificate (Required)
- Baby Birth Certificate (Required)
- Baby Passport and Photo (Required)
- Additional Supporting Documents (Optional)

## Standard Document Requirements

All uploads must meet these standards:
- **Passport**: Clear scan of bio page, minimum 300 DPI
- **Passport Photo**: White background, passport style, recent (last 6 months)
- **Certificates**: Clear scan, English or Chinese translation if required
- **Medical File**: Official hospital report
- **Police Certificate**: Issued within last 6 months

## File Validation Rules

### General Rules
- Allowed formats: PDF, JPG, JPEG, PNG, DOC, DOCX
- Maximum file size: 10MB (configurable via settings)
- File type validation with MIME checking

### Visa-Specific Rules
- **Passport Bio Page**: Minimum 100KB (indicates 300 DPI resolution)
- **Passport Photos**: Maximum 2MB, must be JPG/JPEG/PNG
- **Medical Reports**: Minimum 50KB for clarity
- **Police Certificates**: Minimum 50KB, must be recent
- **Videos**: Maximum 50MB for business registration

## Database Migration

To apply the migration:

```bash
# Note: This requires PostgreSQL to be properly configured
cd backend
python manage.py migrate
```

The migration will:
1. Create new ServiceType records for China visa types
2. Create RequiredDocument records for each service
3. Populate with detailed requirements and notes

## API Endpoints

### New Endpoints
- `GET /api/documents/service-types/` - List all service types
- `GET /api/documents/document-requirements/` - List all document requirements
- `GET /api/documents/document-requirements/?service__key={key}` - Filter by service

### Enhanced Endpoints
- `POST /api/documents/` - Now includes visa-specific validation
- Document uploads are validated based on applicant's visa type

## Frontend Integration

### Component Usage
```tsx
<DocumentRequirements
  serviceKey="china_business_registration"
  applicantId={123}
  onDocumentUpload={() => setActiveTab('documents')}
  className="animate-in fade-in-0"
/>
```

### Props
- `serviceKey`: The visa type key (e.g., 'china_business_registration')
- `applicantId`: Optional applicant ID for fetching existing documents
- `onDocumentUpload`: Callback when user wants to upload documents
- `className`: Additional CSS classes

## Testing

### Manual Testing Steps

1. **Database Setup**
   - Ensure PostgreSQL is running
   - Run migrations: `python backend/manage.py migrate`

2. **API Testing**
   - Test service types endpoint: `GET /api/documents/service-types/`
   - Test document requirements endpoint: `GET /api/documents/document-requirements/`
   - Test document upload with different visa types

3. **Frontend Testing**
   - Navigate to Application Detail page
   - Select different visa types
   - Verify document requirements display correctly
   - Test document upload with validation

4. **Validation Testing**
   - Upload low-resolution passport scans (should fail)
   - Upload incorrect file formats (should fail)
   - Upload files with wrong names (should warn)
   - Test with different visa types

### Expected Results
- All 7 China visa types should be available
- Document requirements should display with proper status indicators
- File validation should enforce visa-specific rules
- Progress tracking should update in real-time
- Standard document requirements should be clearly displayed

## Configuration

### Environment Variables
Ensure these are set in `.env`:
```
PG_NAME=individual_portal
PG_USER=individual_user
PG_PASSWORD=individual_password
PG_HOST=localhost
PG_PORT=5432
```

### Django Settings
The implementation uses existing settings:
- `ALLOWED_UPLOAD_EXTENSIONS` - File type restrictions
- `FILE_UPLOAD_MAX_MEMORY_SIZE` - File size limits

## Future Enhancements

1. **Video Upload Support** - Add proper video upload handling for business registration
2. **OCR Integration** - Extract text from uploaded documents
3. **Document Templates** - Provide downloadable templates for required documents
4. **Multi-language Support** - Add Chinese translations for document requirements
5. **Document Expiry Tracking** - Track and warn about expiring documents
6. **Bulk Upload** - Allow uploading multiple documents at once
7. **Document Preview** - Preview documents before upload

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Ensure PostgreSQL is running and accessible
   - Check database credentials in `.env`
   - Verify database permissions

2. **File Upload Failures**
   - Check file size limits in settings
   - Verify file format restrictions
   - Ensure visa type is set on applicant

3. **Frontend Display Issues**
   - Verify API endpoints are accessible
   - Check network requests in browser dev tools
   - Ensure visa type keys match between backend and frontend

### Debug Commands
```bash
# Check service types
curl http://localhost:8000/api/documents/service-types/

# Check document requirements
curl http://localhost:8000/api/documents/document-requirements/

# Test document upload
curl -X POST http://localhost:8000/api/documents/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "applicant=1" \
  -F "document_type=passport" \
  -F "file=@passport.jpg"
```

## Security Considerations

- File uploads are validated for type and size
- UUID primary keys prevent enumeration attacks
- File paths are obfuscated using random UUIDs
- Document access is restricted by applicant ownership
- Admin verification is required for document approval

## Performance Considerations

- Document requirements are cached on component mount
- File validation is performed server-side
- Progress calculations are done client-side
- Database queries are optimized with proper indexing

This implementation provides a comprehensive solution for managing China visa and business registration document requirements with proper validation, user experience, and maintainability.