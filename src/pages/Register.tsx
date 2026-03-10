import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Mail, Lock, User, UserPlus } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.registerApplicant({ email, password, ...(fullName && { full_name: fullName }) });
      
      // Redirect to login and pass the verification instruction in the state
      navigate('/login', { 
        state: { message: 'Registration successful! Please check your email to verify your account before logging in.' } 
      });
      
    } catch (err) {
      setError((err as any)?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.png" alt="Hainan Builder" className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Register as an Individual Applicant</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Min. 12 characters" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium disabled:opacity-50">
              <UserPlus className="h-5 w-5" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {/* Changed from <Link> to standard <a href="..."> */}
            <p className="text-sm text-gray-600">Already have an account? <a href="/login" className="font-medium text-orange-500 hover:text-orange-600">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
