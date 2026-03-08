import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  STATUS_STAGES, BACKEND_DOCUMENT_TYPES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE,
  getStatusColor, getDocStatusColor
} from '@/lib/supabase';
import Layout from '@/components/Layout';
import DocumentRequirements from '@/components/DocumentRequirements';
import { 
  ArrowLeft, Upload, Download, Send, FileText, MessageSquare, Clock, 
  Check, X, AlertCircle, User, Edit2, DollarSign, History, 
  Trash2, RefreshCw, CheckCircle
} from 'lucide-react';

interface Applicant {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  nationality?: string;
  visa_type?: string;
  date_of_birth?: string;
  destination_country?: string;
  marital_status?: string;
  status: string;
  notes?: string;
  extra_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  applicant: number;
  document_type: string;
  file: string;
  original_filename: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  uploaded_at: string;
}

interface Payment {
  id: number;
  applicant: number;
  amount: number | string;
  currency: string;
  status: 'unpaid' | 'paid' | 'partial' | 'refunded';
  payment_date?: string | null;
  invoice_number?: string;
  receipt_file?: string | null;
  notes?: string;
  created_at: string;
}

interface ServiceType {
  id: number;
  key: string;
  name: string;
  description?: string;
}

interface DocumentRequirement {
  id: number;
  service: number;
  service_key?: string;
  service_name?: string;
  document_name: string;
  is_optional: boolean;
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [app, setApp] = useState<Applicant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'messages' | 'history' | 'payments'>('documents');
  
  const [extraDataEdit, setExtraDataEdit] = useState<Record<string, string>>({});
  
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Applicant | null>(null);
  const [newExtraKey, setNewExtraKey] = useState('');
  const [newExtraValue, setNewExtraValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member';

  const visaTypeKey = app?.visa_type?.toLowerCase().replace(/\s+/g, '_') || '';

  // Get custom fields for the visa type
  const getCustomFieldsForVisaType = (visaType: string): { key: string; label: string; isDocument: boolean }[] => {
    const visaFields: Record<string, { key: string; label: string; isDocument: boolean }[]> = {
      'china_business_registration': [
        { key: 'passport_bio_page', label: 'Passport Bio Page', isDocument: true },
        { key: 'company_name', label: 'Company Name', isDocument: false },
        { key: 'business_scope', label: 'Business Scope', isDocument: false },
        { key: 'email', label: 'Email', isDocument: false },
        { key: 'phone', label: 'Phone Number', isDocument: false },
        { key: 'introduction_video', label: 'Introduction Video', isDocument: true }
      ],
      'china_work_visa_z': [
        { key: 'professional_certificate', label: 'Professional Certificate / Degree Certificate', isDocument: true },
        { key: 'experience_letter', label: 'Experience Letter', isDocument: true },
        { key: 'medical_file', label: 'Medical File', isDocument: true },
        { key: 'police_certificate', label: 'Police Non-Criminal Certificate', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'additional_documents', label: 'Any Additional Documents', isDocument: true }
      ],
      'china_business_visa_m': [
        { key: 'passport', label: 'Passport', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'company_license', label: 'Company License', isDocument: true },
        { key: 'police_certificate', label: 'Police Non-Criminal Certificate', isDocument: true },
        { key: 'hotel_booking', label: 'Hotel Booking', isDocument: true },
        { key: 'ticket', label: 'Ticket', isDocument: true },
        { key: 'email', label: 'Email', isDocument: false },
        { key: 'phone', label: 'Phone Number', isDocument: false },
        { key: 'china_last_entry', label: 'China Last Entry (if any)', isDocument: true }
      ],
      'china_canton_fair_visa': [
        { key: 'passport', label: 'Passport', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'business_card', label: 'Business Card', isDocument: true },
        { key: 'email', label: 'Email', isDocument: false },
        { key: 'phone', label: 'Phone Number', isDocument: false },
        { key: 'china_last_entry', label: 'China Last Entry (if any)', isDocument: true }
      ],
      'china_tourist_visa_l': [
        { key: 'passport_bio_page', label: 'Passport Bio Page', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'police_certificate', label: 'Police Non-Criminal Certificate', isDocument: true },
        { key: 'email', label: 'Email', isDocument: false },
        { key: 'phone', label: 'Phone Number', isDocument: false },
        { key: 'china_last_entry', label: 'China Last Entry (if any)', isDocument: true }
      ],
      'china_medical_health_tourism_visa': [
        { key: 'passport_bio_page', label: 'Passport Bio Page', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'medical_reports', label: 'Medical Reports', isDocument: true },
        { key: 'email', label: 'Email', isDocument: false },
        { key: 'phone', label: 'Phone Number', isDocument: false },
        { key: 'china_last_entry', label: 'China Last Entry (if any)', isDocument: true }
      ],
      'china_family_visa': [
        { key: 'professional_certificate', label: 'Professional Certificate / Degree Certificate', isDocument: true },
        { key: 'experience_letter', label: 'Experience Letter', isDocument: true },
        { key: 'medical_file', label: 'Medical File', isDocument: true },
        { key: 'police_certificate', label: 'Police Non-Criminal Certificate', isDocument: true },
        { key: 'white_background_photo', label: 'White Background Photo', isDocument: true },
        { key: 'marriage_certificate', label: 'Marriage Certificate', isDocument: true },
        { key: 'birth_certificate', label: 'Birth Certificate of Baby', isDocument: true },
        { key: 'baby_passport_photo', label: 'Baby Passport and Photo', isDocument: true },
        { key: 'additional_documents', label: 'Any Additional Documents', isDocument: true }
      ]
    };
    return visaFields[visaType] || [];
  };

  const customFields = getCustomFieldsForVisaType(visaTypeKey);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const applicantId = parseInt(id);
      const [appData, docsData, payData, servicesData, reqsData] = await Promise.all([
        api.getApplicant(applicantId),
        api.getDocuments(applicantId),
        api.getPayments(applicantId),
        api.getServiceTypes().catch(() => []),
        api.getDocumentRequirements().catch(() => []),
      ]);
      setApp(appData);
      const normalizedDocs = Array.isArray(docsData) ? docsData : ((docsData as any)?.results || []);
      const normalizedPayments = Array.isArray(payData) ? payData : ((payData as any)?.results || []);
      setDocuments(normalizedDocs);
      setPayments(normalizedPayments);
      setServiceTypes(Array.isArray(servicesData) ? servicesData : ((servicesData as any)?.results || []));
      setDocumentRequirements(Array.isArray(reqsData) ? reqsData : ((reqsData as any)?.results || []));
      setMessages([]);
      setStatusHistory([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (newStatus: string) => {
    if (!app) return;
    try {
      await api.updateApplicant(app.id, { status: newStatus });
      setApp({ ...app, status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateExtraField = (key: string, value: string) => {
    setExtraDataEdit(prev => ({ ...prev, [key]: value }));
  };

  const saveExtraData = async () => {
    if (!app) return;
    try {
      const updatedExtraData = { ...(app.extra_data || {}), ...extraDataEdit };
      await api.updateApplicant(app.id, { extra_data: updatedExtraData });
      setApp({ ...app, extra_data: updatedExtraData });
    } catch (error) {
      console.error('Error saving custom fields:', error);
      alert('Failed to save custom fields');
    }
  };

  const sendMessage = async () => {
    alert('Messages feature coming soon');
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 50MB`;
    }
    return null;
  };

  const uploadFile = async (file: File, category: string) => {
    if (!app) return;
    const error = validateFile(file);
    if (error) { alert(error); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('applicant', app.id.toString());
      formData.append('document_type', category);
      formData.append('file', file);
      const typeLabel = BACKEND_DOCUMENT_TYPES.find(t => t.value === category)?.label;
      if (typeLabel) formData.append('notes', `Uploaded: ${typeLabel}`);
      await api.uploadDocument(formData);
      fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (doc: Document) => {
    try {
      const blob = await api.downloadDocument(doc.id as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const updateDocStatus = async (docId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await api.updateDocument(docId, { status, notes: comment || undefined });
      fetchData();
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(doc.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  if (loading) return <Layout><div className="text-center py-12"><div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div></div></Layout>;
  if (!app) return <Layout><div className="text-center py-12">Application not found</div></Layout>;

  const documentTypeOptions = [...BACKEND_DOCUMENT_TYPES];

  const computeStageFromDocs = () => {
    const categories = documentTypeOptions.map(d => d.value);
    const totalRequired = categories.length;
    if (totalRequired === 0) return -1;
    const categoryDocs = categories.map(cat => documents.filter(d => d.document_type === cat));
    const uploadedCategories = categoryDocs.filter(arr => arr.length > 0).length;
    const approvedCategories = categoryDocs.filter(arr => arr.some(d => d.status === 'approved')).length;
    const rejectedCategories = categoryDocs.filter(arr => arr.some(d => d.status === 'rejected')).length;
    const pendingOnlyCategories = categoryDocs.filter(arr => arr.length > 0 && arr.every(d => d.status === 'pending')).length;
    const approvedPercent = approvedCategories / totalRequired;
    if (approvedCategories === totalRequired) return 6;
    if (approvedPercent > 0.9) return 5;
    if (approvedPercent > 0.5) return 4;
    if (approvedCategories > 0 || rejectedCategories > 0) return 3;
    if (uploadedCategories === totalRequired) return 2;
    if (uploadedCategories > 0 && pendingOnlyCategories === uploadedCategories) return 1;
    return 0;
  };

  const statusToStageIndex: Record<string, number> = { new: 0, docs_pending: 1, processing: 4, approved: 6, rejected: 7, completed: 6 };
  const docStage = computeStageFromDocs();
  const backendStage = statusToStageIndex[app.status] ?? 0;
  const currentStageIdx = docStage >= 0 ? Math.max(backendStage, docStage) : backendStage;

  const openEditModal = () => {
    setEditingApp({ ...app });
    setShowEditModal(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleAddExtraField = () => {
    if (newExtraKey.trim() && editingApp) {
      const newExtra = { ...(editingApp.extra_data || {}), [newExtraKey.trim()]: newExtraValue };
      setEditingApp({ ...editingApp, extra_data: newExtra });
      setNewExtraKey('');
      setNewExtraValue('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingApp) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.updateApplicant(editingApp.id, {
        full_name: editingApp.full_name,
        email: editingApp.email,
        phone: editingApp.phone,
        passport_number: editingApp.passport_number,
        nationality: editingApp.nationality,
        visa_type: editingApp.visa_type,
        destination_country: editingApp.destination_country,
        date_of_birth: editingApp.date_of_birth,
        marital_status: editingApp.marital_status,
        status: editingApp.status,
        notes: editingApp.notes,
        extra_data: editingApp.extra_data,
      });
      setSaveSuccess('Application updated successfully!');
      fetchData();
      setTimeout(() => { setShowEditModal(false); setEditingApp(null); setSaveSuccess(''); }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  {app.full_name}
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>
              {isAdmin && (
                <button onClick={openEditModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Passport:</span> <span className="text-gray-900 font-medium">{app.passport_number || '-'}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{app.email || '-'}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{app.phone || '-'}</span></div>
              <div><span className="text-gray-500">Nationality:</span> <span className="text-gray-900">{app.nationality || '-'}</span></div>
              <div><span className="text-gray-500">Visa Type:</span> <span className="text-gray-900 font-medium">{app.visa_type || '-'}</span></div>
              <div><span className="text-gray-500">DOB:</span> <span className="text-gray-900">{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : '-'}</span></div>
            </div>
            {app.notes && <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{app.notes}</p>}
          </div>

          {app?.visa_type && (
            <DocumentRequirements
              serviceKey={visaTypeKey}
              applicantId={app.id}
              onDocumentUpload={() => setActiveTab('documents')}
              className="animate-in fade-in-0"
            />
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Progress</h3>
            <div className="relative">
              <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded">
                <div className="h-full bg-orange-500 rounded transition-all" style={{ width: `${(currentStageIdx / (STATUS_STAGES.length - 1)) * 100}%` }} />
              </div>
              <div className="relative flex justify-between">
                {STATUS_STAGES.map((stage, idx) => (
                  <div key={stage} className="flex flex-col items-center" style={{ width: `${100 / STATUS_STAGES.length}%` }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium z-10 border-2 ${idx < currentStageIdx ? 'bg-orange-500 border-orange-500 text-white' : idx === currentStageIdx ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100' : 'bg-white border-gray-300 text-gray-400'}`}>
                      {idx < currentStageIdx ? <Check className="h-5 w-5" /> : idx + 1}
                    </div>
                    <span className="mt-2 text-xs text-center text-gray-600 hidden md:block max-w-[80px]">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select value={app.status} onChange={(e) => updateStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500">
                  <option value="new">New</option>
                  <option value="docs_pending">Docs Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b">
              {[
                { key: 'documents', label: 'Documents', icon: FileText, count: documents.length },
                { key: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
                { key: 'history', label: 'Status History', icon: History, count: statusHistory.length },
                { key: 'payments', label: 'Payments', icon: DollarSign, count: payments.length }
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition ${activeTab === tab.key ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'documents' && (
                <div>
                  {uploading && (
                    <div className="mb-4 p-4 bg-orange-50 text-orange-700 rounded-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Uploading document...</span>
                    </div>
                  )}
                  
                  <h4 className="font-medium text-gray-900 mb-3">Document Checklist</h4>
                  <div className="space-y-2">
                    {customFields.map((field) => {
                      const fieldValue = extraDataEdit[field.key] !== undefined 
                        ? extraDataEdit[field.key] 
                        : (app.extra_data?.[field.key] || '');

                      const catDocs = documents.filter(d => d.document_type === field.key);
                      const hasApproved = catDocs.some(d => d.status === 'approved');
                      const hasUploaded = catDocs.length > 0;
                      
                      return (
                        <div key={field.key} className={`flex items-center justify-between p-3 rounded-lg border ${hasApproved ? 'border-green-200 bg-green-50' : hasUploaded ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            {hasApproved ? <CheckCircle className="h-5 w-5 text-green-600" /> : hasUploaded ? <Clock className="h-5 w-5 text-blue-600" /> : <AlertCircle className="h-5 w-5 text-gray-400" />}
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {field.isDocument ? (
                              <>
                                <span className={`text-xs px-2 py-1 rounded-full ${hasApproved ? 'bg-green-100 text-green-700' : hasUploaded ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {hasApproved ? 'Approved' : hasUploaded ? 'Uploaded' : 'Pending'}
                                </span>
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition ${hasApproved ? 'bg-green-500 text-white hover:bg-green-600' : hasUploaded ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                                  <Upload className="h-4 w-4" />
                                  Upload
                                  <input type="file" className="hidden" disabled={uploading} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadFile(file, field.key);
                                    e.target.value = '';
                                  }} />
                                </label>
                              </>
                            ) : (
                              <input
                                type="text"
                                value={fieldValue}
                                onChange={(e) => updateExtraField(field.key, e.target.value)}
                                onBlur={saveExtraData}
                                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                placeholder={`Enter ${field.label}`}
                                disabled={!isAdmin}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {documents.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.original_filename}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{doc.document_type}</span>
                                  <span>-</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                  <span className={`px-1.5 py-0.5 rounded ${getDocStatusColor(doc.status)}`}>{doc.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin && doc.status === 'pending' && (
                                <>
                                  <button onClick={() => updateDocStatus(doc.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-100 rounded"><Check className="h-4 w-4" /></button>
                                  <button onClick={() => { const comment = prompt('Rejection reason:'); if (comment) updateDocStatus(doc.id, 'rejected', comment); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><X className="h-4 w-4" /></button>
                                </>
                              )}
                              <button onClick={() => downloadFile(doc)} className="p-1.5 text-orange-500 hover:bg-orange-100 rounded"><Download className="h-4 w-4" /></button>
                              {isAdmin && <button onClick={() => deleteDocument(doc)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded"><Trash2 className="h-4 w-4" /></button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div>
                  <div className="h-80 overflow-y-auto mb-4 space-y-3">
                    {messages.length === 0 ? <p className="text-gray-500 text-center py-8">No messages yet</p> : messages.map(msg => (
                      <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-orange-50 ml-8' : 'bg-gray-100 mr-8'}`}>
                        <p className="text-sm text-gray-900">{msg.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
                    <button onClick={sendMessage} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"><Send className="h-5 w-5" /></button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {statusHistory.length === 0 ? <p className="text-gray-500 text-center py-8">No status history</p> : statusHistory.map(h => (
                    <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <History className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {h.old_status && <span className="text-sm text-gray-500">{h.old_status}</span>}
                          {h.old_status && <span className="text-gray-400">{'>'}</span>}
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(h.new_status)}`}>{h.new_status}</span>
                        </div>
                        {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  {isAdmin && (
                    <div className="mb-4 flex gap-2">
                      <button onClick={async () => { const amount = prompt('Enter amount (USD):'); if (!amount || isNaN(parseFloat(amount))) return; const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`; await api.createPayment({ applicant: app.id, amount: parseFloat(amount), currency: 'USD', status: 'unpaid', invoice_number: invoiceNum }); fetchData(); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">Create Invoice</button>
                    </div>
                  )}
                  {payments.length === 0 ? <div className="text-center py-8"><DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No payment records</p></div> : (
                    <div className="space-y-3">
                      {payments.map(pay => (
                        <div key={pay.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div><p className="font-medium text-gray-900">Payment</p><p className="text-sm text-gray-500">{pay.invoice_number || 'No invoice'}</p></div>
                          <div className="text-right flex items-center gap-3">
                            <div><p className="text-lg font-bold text-gray-900">{pay.currency} {typeof pay.amount === 'number' ? pay.amount.toLocaleString() : pay.amount}</p><span className={`text-xs px-2 py-1 rounded-full ${pay.status === 'paid' ? 'bg-green-100 text-green-700' : pay.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{pay.status}</span></div>
                            {isAdmin && pay.status === 'unpaid' && <button onClick={async () => { try { await api.updatePayment(pay.id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] }); fetchData(); } catch (error) { console.error('Error updating payment:', error); } }} className="px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600">Mark Paid</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-gray-900">{app.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Documents</span><span className="font-medium text-gray-900">{documents.filter(d => d.status === 'approved').length}/{documents.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-sm text-gray-900">{new Date(app.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span className="text-sm text-gray-900">{new Date(app.updated_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveTab('documents')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                <Upload className="h-4 w-4" /> Upload Document
              </button>
              <button onClick={() => setActiveTab('messages')} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                <MessageSquare className="h-4 w-4" /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && editingApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Application</h2>
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              {saveSuccess && <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">{saveSuccess}</div>}
              {saveError && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{saveError}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editingApp.full_name || ''} onChange={(e) => setEditingApp({ ...editingApp, full_name: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editingApp.email || ''} onChange={(e) => setEditingApp({ ...editingApp, email: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={editingApp.phone || ''} onChange={(e) => setEditingApp({ ...editingApp, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <input type="text" value={editingApp.passport_number || ''} onChange={(e) => setEditingApp({ ...editingApp, passport_number: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input type="text" value={editingApp.nationality || ''} onChange={(e) => setEditingApp({ ...editingApp, nationality: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                <input type="text" value={editingApp.visa_type || ''} onChange={(e) => setEditingApp({ ...editingApp, visa_type: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                <input type="text" value={editingApp.destination_country || ''} onChange={(e) => setEditingApp({ ...editingApp, destination_country: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={editingApp.date_of_birth || ''} onChange={(e) => setEditingApp({ ...editingApp, date_of_birth: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <input type="text" value={editingApp.marital_status || ''} onChange={(e) => setEditingApp({ ...editingApp, marital_status: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editingApp.status || 'new'} onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500">
                  <option value="new">New</option>
                  <option value="docs_pending">Docs Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={editingApp.notes || ''} onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" rows={3} />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
                {Object.entries(editingApp.extra_data || {}).map(([key, value]) => (
                  <div key={key} className="flex gap-3 items-start mb-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Field Name</label>
                      <input type="text" value={key} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm" />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                      <input type="text" value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')} onChange={(e) => { const newExtra = { ...editingApp.extra_data }; newExtra[key] = e.target.value; setEditingApp({ ...editingApp, extra_data: newExtra }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-600 mb-2">Add new custom field:</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Field name" value={newExtraKey} onChange={(e) => setNewExtraKey(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                    <input type="text" placeholder="Value" value={newExtraValue} onChange={(e) => setNewExtraValue(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                    <button type="button" onClick={handleAddExtraField} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">Add</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); }} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}