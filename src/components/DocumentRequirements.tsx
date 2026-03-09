import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  FileText, CheckCircle, XCircle, AlertCircle, 
  Plus, Upload, Eye, Download, Trash2, Edit2, 
  BadgeInfo, Clock, Calendar, User, Globe, Mail, Phone
} from 'lucide-react';

interface ServiceType {
  id: number;
  key: string;
  name: string;
  description?: string;
  requirements: Requirement[];
}

interface Requirement {
  id: number;
  title: string;
  optional: boolean;
  notes?: string;
  order: number;
}

interface Document {
  id: string;
  document_type: string;
  status: 'pending' | 'approved' | 'rejected';
  original_filename?: string;
  notes?: string;
  uploaded_at: string;
}

interface DocumentRequirementsProps {
  serviceKey?: string;
  applicantId?: number;
  onDocumentUpload?: () => void;
  className?: string;
}

export default function DocumentRequirements({ 
  serviceKey, 
  applicantId, 
  onDocumentUpload, 
  className = '' 
}: DocumentRequirementsProps) {
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRequirements();
  }, [serviceKey]);

  useEffect(() => {
    if (applicantId) {
      fetchDocuments();
    }
  }, [applicantId]);

  const fetchRequirements = async () => {
    if (!serviceKey) return;
    
    setLoading(true);
    setError('');
    try {
      const services = await api.getServiceTypes();
      const service = services.find(s => s.key === serviceKey);
      if (service) {
        setServiceType(service);
      } else {
        setError('Service requirements not found');
      }
    } catch (err: any) {
      console.error('Error fetching requirements:', err);
      setError('Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!applicantId) return;
    
    try {
      const docs = await api.getDocuments(applicantId);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    }
  };

  const getDocumentStatus = (requirementTitle: string): 'missing' | 'pending' | 'approved' | 'rejected' => {
    // Map requirement titles to document types
    const titleToTypeMap: Record<string, string> = {
      'Passport Bio Page': 'passport',
      'Passport Signature Page': 'passport',
      'White Background Photo': 'photo',
      'Passport Photo': 'photo',
      'Bank Statement': 'bank_statement',
      'Flight Ticket': 'ticket',
      'Travel Insurance': 'insurance',
      'Medical File': 'medical',
      'Police Non-Criminal Certificate': 'police_certificate',
      'Experience Letter': 'experience_letter',
      'Professional Certificate': 'professional_certificate',
      'Degree Certificate': 'degree_certificate',
      'Transcript': 'transcript',
      'Hotel Booking': 'hotel_booking',
      'Flight Booking': 'flight_booking',
      'Itinerary': 'itinerary',
      'Company License': 'company_license',
      'Business Card': 'business_card',
      'Medical Reports': 'medical_reports',
      'Marriage Certificate': 'marriage_certificate',
      'Birth Certificate': 'birth_certificate',
      'Children Passport': 'children_passport',
      'Company Name': 'company_name',
      'Business Scope': 'business_scope',
      'Email Address': 'email',
      'Phone Number': 'phone',
      'Introduction Video': 'introduction_video',
      'Company 3 Name Suggestions': 'company_names',
      'Shareholder Information': 'shareholder_info',
      'China Last Entry Page': 'china_entry',
      'China or Other Country Address': 'address',
      'Business Scope in Short': 'business_scope_short',
      'Language Certificate': 'language_certificate',
      'Additional Certificate': 'additional_certificate',
      'Incorporation Letter': 'incorporation_letter',
      'Information Sheet Filling': 'information_sheet',
      'Previous Health Reports History and Documents Proof': 'health_history',
      'Professional Certificate / Degree Certificate': 'professional_degree',
      'Last Entry to China': 'last_china_entry',
      'Any Additional Supporting Documents': 'additional_supporting'
    };

    const documentType = titleToTypeMap[requirementTitle];
    if (!documentType) return 'missing';

    const doc = documents.find(d => d.document_type === documentType);
    if (!doc) return 'missing';
    
    return doc.status;
  };

  const getStatusIcon = (status: 'missing' | 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: 'missing' | 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return 'Missing';
    }
  };

  const getStatusColor = (status: 'missing' | 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequiredCount = () => {
    if (!serviceType) return { total: 0, completed: 0 };
    const total = serviceType.requirements.length;
    const completed = serviceType.requirements.filter(req => 
      getDocumentStatus(req.title) === 'approved'
    ).length;
    return { total, completed };
  };

  const { total, completed } = getRequiredCount();
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className={`animate-in fade-in-0 ${className}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`animate-in fade-in-0 ${className}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceType) {
    return (
      <div className={`animate-in fade-in-0 ${className}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No document requirements found for this service.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in-0 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{serviceType.name}</h2>
              <BadgeInfo className="h-5 w-5 text-blue-500" />
            </div>
            {serviceType.description && (
              <p className="text-gray-600 mb-4">{serviceType.description}</p>
            )}
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Document Progress</span>
                  <span>{completed}/{total} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress === 100 ? 'approved' : 'pending')}`}>
                {progress === 100 ? 'All Documents Complete' : `${progress}% Complete`}
              </span>
            </div>
          </div>
          
          {onDocumentUpload && (
            <button
              onClick={onDocumentUpload}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </button>
          )}
        </div>
      </div>

      {/* Requirements List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
          <p className="text-gray-600 text-sm mt-1">
            Upload the following documents to complete your application
          </p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {serviceType.requirements.map((requirement) => {
            const status = getDocumentStatus(requirement.title);
            const doc = documents.find(d => {
              // Map requirement to document type for finding existing document
              const titleToTypeMap: Record<string, string> = {
                'Passport Bio Page': 'passport',
                'Passport Signature Page': 'passport',
                'White Background Photo': 'photo',
                'Passport Photo': 'photo',
                'Bank Statement': 'bank_statement',
                'Flight Ticket': 'ticket',
                'Travel Insurance': 'insurance',
                'Medical File': 'medical',
                'Police Non-Criminal Certificate': 'police_certificate',
                'Experience Letter': 'experience_letter',
                'Professional Certificate': 'professional_certificate',
                'Degree Certificate': 'degree_certificate',
                'Transcript': 'transcript',
                'Hotel Booking': 'hotel_booking',
                'Flight Booking': 'flight_booking',
                'Itinerary': 'itinerary',
                'Company License': 'company_license',
                'Business Card': 'business_card',
                'Medical Reports': 'medical_reports',
                'Marriage Certificate': 'marriage_certificate',
                'Birth Certificate': 'birth_certificate',
                'Children Passport': 'children_passport',
                'Company Name': 'company_name',
                'Business Scope': 'business_scope',
                'Email Address': 'email',
                'Phone Number': 'phone',
                'Introduction Video': 'introduction_video',
                'Company 3 Name Suggestions': 'company_names',
                'Shareholder Information': 'shareholder_info',
                'China Last Entry Page': 'china_entry',
                'China or Other Country Address': 'address',
                'Business Scope in Short': 'business_scope_short',
                'Language Certificate': 'language_certificate',
                'Additional Certificate': 'additional_certificate',
                'Incorporation Letter': 'incorporation_letter',
                'Information Sheet Filling': 'information_sheet',
                'Previous Health Reports History and Documents Proof': 'health_history',
                'Professional Certificate / Degree Certificate': 'professional_degree',
                'Last Entry to China': 'last_china_entry',
                'Any Additional Supporting Documents': 'additional_supporting'
              };
              return d.document_type === titleToTypeMap[requirement.title];
            });

            return (
              <div key={requirement.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{requirement.title}</h4>
                        {requirement.optional && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            Optional
                          </span>
                        )}
                      </div>
                      
                      {requirement.notes && (
                        <p className="text-sm text-gray-600 mb-2">{requirement.notes}</p>
                      )}
                      
                      {doc && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </span>
                          {doc.original_filename && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {doc.original_filename}
                            </span>
                          )}
                          {doc.notes && (
                            <span className="flex items-center gap-1">
                              <Edit2 className="h-4 w-4" />
                              {doc.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                    
                    {doc && (
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-500 transition" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standard Document Requirements */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Document Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-5 w-5 text-orange-500" />
            <div>
              <div className="font-medium">Passport</div>
              <div className="text-gray-600">Must show bio page clearly, minimum 300 DPI</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium">Passport Photo</div>
              <div className="text-gray-600">White background, passport style, recent (last 6 months)</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium">Certificates</div>
              <div className="text-gray-600">Must be scanned clearly, English or Chinese translation if required</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-purple-500" />
            <div>
              <div className="font-medium">Medical File</div>
              <div className="text-gray-600">Must include official hospital report</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-5 w-5 text-red-500" />
            <div>
              <div className="font-medium">Police Certificate</div>
              <div className="text-gray-600">Must be issued within the last 6 months</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}