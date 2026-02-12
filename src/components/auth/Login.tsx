import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { getAppleIdentityToken, getGoogleIdToken } from '../../utils/socialAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.5-5.4 3.5-3.2 0-5.8-2.6-5.8-5.8S8.8 6 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7A9.3 9.3 0 1 0 12 21c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.7H12z" />
    <path fill="#FBBC05" d="M3.8 7.6l3.2 2.3A5.8 5.8 0 0 1 12 6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7c-3.6 0-6.7 2.1-8.2 4.9z" />
    <path fill="#34A853" d="M12 21c2.4 0 4.5-.8 6-2.3l-2.8-2.2c-.8.6-1.8 1-3.2 1-2.4 0-4.5-1.6-5.2-3.9l-3.2 2.5A9.3 9.3 0 0 0 12 21z" />
    <path fill="#4285F4" d="M20.9 11.9c0-.6-.1-1.1-.2-1.7H12v3.9h5.4c-.2 1.2-.9 2.1-2 2.8l2.8 2.2c1.7-1.6 2.7-4 2.7-7.2z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.7 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3-.5 7.5 1.3 10 1 1.2 2.1 2.6 3.6 2.5 1.4-.1 1.9-.9 3.6-.9s2.1.9 3.6.9c1.5 0 2.4-1.3 3.3-2.5 1.1-1.5 1.5-2.9 1.6-3-.1 0-3.1-1.2-3.1-4.4zM14.4 5.8c.8-1 .9-2 .9-2.3-1.2.1-2.5.8-3.4 1.8-.8.9-1 1.9-1 2.3 1.3.1 2.6-.7 3.5-1.8z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setAuthData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      const nextPath = (location.state as any)?.next;
      navigate(nextPath || '/menu');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSocialAuth = async (provider: 'google' | 'apple', token: string) => {
    const response = provider === 'google'
      ? await apiService.loginWithGoogle({ idToken: token })
      : await apiService.loginWithApple({ identityToken: token });

    if (!response?.token) {
      throw new Error('Social sign-in failed');
    }

    const profile = await apiService.getMe(response.token);
    setAuthData({
      user: profile?.user || profile,
      token: response.token,
      refreshToken: response.refreshToken,
    });
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setIsSocialLoading(provider);
    try {
      const token = provider === 'google'
        ? await getGoogleIdToken()
        : await getAppleIdentityToken();

      await completeSocialAuth(provider, token);

      toast.success(`${provider === 'google' ? 'Google' : 'Apple'} sign-in successful`);
      const nextPath = (location.state as any)?.next;
      navigate(nextPath || '/menu');
    } catch (error: any) {
      toast.error(error.message || `${provider} sign-in failed`);
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-rose-500/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1626200711570-ea66d2226668?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZm9vZCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcwOTc1OTg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Luxury Restaurant Food"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-4xl font-serif text-white mb-4">Glossy-Gly-Kitchen</h2>
          <p className="text-xl text-white/90">Experience culinary excellence at your fingertips</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif mb-2 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue your culinary journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="........"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-amber-600 hover:text-amber-700 font-medium">
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-r from-amber-50 via-white to-rose-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSocialLoading !== null}
              onClick={() => handleSocialSignIn('google')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
            >
              <GoogleIcon />
              <span>{isSocialLoading === 'google' ? 'Connecting...' : 'Google'}</span>
            </button>
            <button
              type="button"
              disabled={isSocialLoading !== null}
              onClick={() => handleSocialSignIn('apple')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
            >
              <AppleIcon />
              <span>{isSocialLoading === 'apple' ? 'Connecting...' : 'Apple'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

