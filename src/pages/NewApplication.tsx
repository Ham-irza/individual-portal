import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SERVICE_TYPES } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  ArrowLeft, Save, User, Mail, Phone, Globe, FileText, Calendar, 
  AlertCircle, Plus, Trash2, Heart, MapPin, Upload
} from 'lucide-react';

interface CustomField {
  key: string;
  value: string;
}

export default function NewApplication() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pre-populate form with logged-in user's details
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    nationality: '',
    passport_number: '',
    passport_expiry_date: '',
    date_of_birth: '',
    gender: 'M' as 'M' | 'F' | 'O',
    marital_status: 'single' as 'single' | 'married' | 'divorced' | 'widowed',
    visa_type: SERVICE_TYPES[0] as string,
    current_country: '',
    travel_date: '',
    notes: ''
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File | null>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', text: string) => {
    const newFields = [...customFields];
    newFields[index][field] = text;
    setCustomFields(newFields);
  };

  // Get custom fields for the selected visa type
  const getCustomFieldsForVisaType = (visaType: string): CustomField[] => {
    const visaFields: Record<string, CustomField[]> = {
      'China Business Registration': [
        { key: 'Company Name', value: '' },
        { key: 'Business Scope', value: '' },
        { key: 'Email Address', value: '' },
        { key: 'Phone Number', value: '' },
        { key: 'Passport Bio Page', value: '' },
        { key: 'Introduction Video', value: '' }
      ],
      'China Work Visa (Z Visa)': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'Professional Certificate', value: '' },
        { key: 'Degree Certificate', value: '' },
        { key: 'Experience Letter', value: '' },
        { key: 'Medical File', value: '' },
        { key: 'Police Non-Criminal Certificate', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Additional Documents', value: '' }
      ],
      'China Business Visa (M Visa)': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Company License', value: '' },
        { key: 'Police Non-Criminal Certificate', value: '' },
        { key: 'Hotel Booking', value: '' },
        { key: 'Flight Ticket', value: '' },
        { key: 'Email Address', value: '' },
        { key: 'Phone Number', value: '' },
        { key: 'Last Entry to China', value: '' }
      ],
      'China Canton Fair Visa': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Business Card', value: '' },
        { key: 'Email Address', value: '' },
        { key: 'Phone Number', value: '' },
        { key: 'Last Entry to China', value: '' }
      ],
      'China Tourist Visa (L Visa)': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Police Non-Criminal Certificate', value: '' },
        { key: 'Email Address', value: '' },
        { key: 'Phone Number', value: '' },
        { key: 'Last Entry to China', value: '' }
      ],
      'China Medical/Health Tourism Visa': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Medical Reports', value: '' },
        { key: 'Email Address', value: '' },
        { key: 'Phone Number', value: '' },
        { key: 'Last Entry to China', value: '' }
      ],
      'China Family Visa': [
        { key: 'Passport Bio Page', value: '' },
        { key: 'Professional Certificate', value: '' },
        { key: 'Degree Certificate', value: '' },
        { key: 'Experience Letter', value: '' },
        { key: 'Medical File', value: '' },
        { key: 'Police Non-Criminal Certificate', value: '' },
        { key: 'White Background Photo', value: '' },
        { key: 'Marriage Certificate', value: '' },
        { key: 'Birth Certificate', value: '' },
        { key: 'Baby Passport', value: '' },
        { key: 'Baby Photo', value: '' },
        { key: 'Additional Documents', value: '' }
      ]
    };
    return visaFields[visaType] || [];
  };

  // Determine if a field is a document field
  const isDocumentField = (fieldName: string): boolean => {
    const documentFields = [
      'Passport Bio Page',
      'White Background Photo',
      'Professional Certificate',
      'Degree Certificate',
      'Experience Letter',
      'Medical File',
      'Police Non-Criminal Certificate',
      'Company License',
      'Hotel Booking',
      'Flight Ticket',
      'Business Card',
      'Medical Reports',
      'Marriage Certificate',
      'Birth Certificate',
      'Baby Passport',
      'Baby Photo',
      'Introduction Video',
      'Additional Documents'
    ];
    return documentFields.includes(fieldName);
  };

  const handleVisaTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const visaType = e.target.value;
    setFormData(prev => ({ ...prev, visa_type: visaType }));
    // Set custom fields based on visa type
    const fields = getCustomFieldsForVisaType(visaType);
    setCustomFields(fields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert custom fields to extra_data object
      const extraData = customFields.reduce((acc, field) => {
        if (field.key.trim()) {
          acc[field.key.trim()] = field.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const applicantData: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim() || '',
        passport_number: formData.passport_number.trim() || '',
        passport_expiry_date: formData.passport_expiry_date || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        marital_status: formData.marital_status,
        visa_type: formData.visa_type,
        current_country: formData.current_country,
        travel_date: formData.travel_date || null,
        notes: formData.notes.trim() || '',
        status: 'new',
      };

      // Add extra_data only if there are custom fields
      if (Object.keys(extraData).length > 0) {
        applicantData.extra_data = extraData;
      }

      const data = await api.createApplicant(applicantData);
      navigate(`/applications/${data.id}`);
    } catch (err: unknown) {
      console.error('Error creating application:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create application');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Update the uploaded files state to show the file name
    setUploadedFiles(prev => ({ ...prev, [index]: file }));
  };

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      <div className="max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Visa Application</h1>
          <p className="text-gray-600 mt-1">Submit your visa application with all required details</p>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="As per passport"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+92 300 1234567"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Pakistan"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="AB123456"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="passport_expiry_date"
                    value={formData.passport_expiry_date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visa Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Visa Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type *</label>
                <select
                  name="visa_type"
                  value={formData.visa_type}
                  onChange={handleVisaTypeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Country of Residence</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="current_country"
                    value={formData.current_country}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Pakistan"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Travel Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="travel_date"
                    value={formData.travel_date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Any special requirements or additional information..."
            />
          </div>

          {/* Section 4: Additional Information */}
          {customFields.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Additional Information
                </h2>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Note: Additional documents and requirements will be requested and uploaded through your application dashboard after submission.
              </p>

              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.key}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        {field.key === 'Passport Bio Page' && 'Clear scan of passport information page, minimum 300 DPI'}
                        {field.key === 'White Background Photo' && 'Recent passport photo with white background'}
                        {field.key === 'Professional Certificate' && 'Proof of professional qualifications'}
                        {field.key === 'Degree Certificate' && 'Academic degree certificate'}
                        {field.key === 'Experience Letter' && 'Proof of previous employment experience'}
                        {field.key === 'Medical File' && 'Official medical examination report'}
                        {field.key === 'Police Non-Criminal Certificate' && 'Background check certificate, issued within last 6 months'}
                        {field.key === 'Company License' && 'Business license of the Chinese company'}
                        {field.key === 'Hotel Booking' && 'Confirmed hotel reservation for the stay in China'}
                        {field.key === 'Flight Ticket' && 'Confirmed flight booking or detailed travel itinerary'}
                        {field.key === 'Business Card' && 'Professional business card'}
                        {field.key === 'Medical Reports' && 'Official medical diagnosis and treatment records'}
                        {field.key === 'Marriage Certificate' && 'Marriage certificate for spouse applicants'}
                        {field.key === 'Birth Certificate' && 'Birth certificate for children applicants'}
                        {field.key === 'Baby Passport' && 'Passport for children applicants'}
                        {field.key === 'Baby Photo' && 'Photo for children applicants'}
                        {field.key === 'Company Name' && 'Required for business registration'}
                        {field.key === 'Business Scope' && 'Description of activities the company will perform'}
                        {field.key === 'Email Address' && 'Contact email for business registration'}
                        {field.key === 'Phone Number' && 'Contact phone for business registration'}
                        {field.key === 'Introduction Video' && 'Short video introducing the applicant and business purpose'}
                        {field.key === 'Last Entry to China' && 'Previous China visa or entry stamp if applicable'}
                        {field.key === 'Additional Documents' && 'Additional documents as requested by authorities'}
                      </p>
                      
                      {isDocumentField(field.key) ? (
                        // Document field - show placeholder
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Document will be uploaded in application dashboard</span>
                        </div>
                      ) : (
                        // Text input field
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          placeholder={`Enter ${field.key}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
