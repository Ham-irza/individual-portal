import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Save, User, Phone, Palette, Settings as SettingsIcon, Workflow, Mail, Globe, Shield, Key, Eye, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const isAdmin = profile?.role === 'admin';

  // Profile settings
  const [profileForm, setProfileForm] = useState({ 
    full_name: '', 
    phone: '',
    country: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
  });

  // Security settings (2FA)
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        website: '',
      });
    }
    fetchTwoFactorStatus();
  }, [profile]);

  const fetchTwoFactorStatus = async () => {
    try {
      const data = await api.getTwoFactorAuth();
      setSecurityForm({
        twoFactorEnabled: data.is_enabled || false,
        twoFactorMethod: data.method || 'email',
      });
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      await supabase.from('profiles').update({ 
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        country: profileForm.country,
        updated_at: new Date().toISOString()
      }).eq('id', profile!.id);
      
      await refreshProfile();
      setSuccess('Profile settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    setLoading2FA(true);
    setError('');
    setSuccess('');
    
    try {
      if (securityForm.twoFactorEnabled) {
        await api.updateTwoFactorAuth({ 
          is_enabled: false, 
          method: securityForm.twoFactorMethod 
        });
        setSecurityForm({ ...securityForm, twoFactorEnabled: false });
        setSuccess('Two-factor authentication disabled');
      } else {
        setShow2FAModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update 2FA settings');
    } finally {
      setLoading2FA(false);
    }
  };

  const handle2FAVerification = async () => {
    setLoading2FA(true);
    setError('');
    
    try {
      await api.updateTwoFactorAuth({ 
        is_enabled: true, 
        method: securityForm.twoFactorMethod 
      });
      setSecurityForm({ ...securityForm, twoFactorEnabled: true });
      setShow2FAModal(false);
      setSuccess('Two-factor authentication enabled successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === tab.key 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={profile?.email || ''} disabled 
                  className="w-full border border-gray-200 rounded-lg py-2.5 px-3 bg-gray-50 text-gray-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={profileForm.country} onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Add an extra layer of security to your account.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={securityForm.twoFactorEnabled}
                      onChange={handleTwoFactorToggle}
                      className="sr-only peer"
                      disabled={loading2FA}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                {securityForm.twoFactorEnabled && (
                  <div className="mt-4 pl-14">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Two-factor authentication is enabled
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Password</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Change your password to keep your account secure.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Active Sessions</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your active sessions across devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                You'll receive verification codes via email when logging in.
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShow2FAModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handle2FAVerification}
                disabled={loading2FA}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {loading2FA ? 'Enabling...' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoadingPassword(true);
              setError('');
              try {
                await api.changePassword(passwordForm);
                setSuccess('Password changed successfully!');
                setShowPasswordModal(false);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
              } catch (err: any) {
                setError(err.message || 'Failed to change password');
              } finally {
                setLoadingPassword(false);
              }
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
              <div className="p-6 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingPassword || passwordForm.new_password !== passwordForm.confirm_password}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loadingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
