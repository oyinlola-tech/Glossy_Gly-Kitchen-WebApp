import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setAuthData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [socialToken, setSocialToken] = useState({ google: '', apple: '' });

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

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    const rawToken = socialToken[provider].trim();
    if (!rawToken) {
      toast.error(`Enter a valid ${provider === 'google' ? 'Google ID token' : 'Apple identity token'}`);
      return;
    }
    setIsSocialLoading(provider);
    try {
      const response = provider === 'google'
        ? await apiService.loginWithGoogle({ idToken: rawToken })
        : await apiService.loginWithApple({ identityToken: rawToken });

      if (!response?.token) {
        throw new Error('Social sign-in failed');
      }
      const profile = await apiService.getMe(response.token);
      setAuthData({
        user: profile?.user || profile,
        token: response.token,
        refreshToken: response.refreshToken,
      });
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
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-rose-500/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1626200711570-ea66d2226668?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZm9vZCUyMGVsZWdhbnR8ZW58MXx8fHwxNzcwOTc1OTg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Luxury Restaurant Food"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-4xl font-serif text-white mb-4">
            Glossy-Gly-Kitchen
          </h2>
          <p className="text-xl text-white/90">
            Experience culinary excellence at your fingertips
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
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
              <button
                onClick={() => navigate('/signup')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-r from-amber-50 via-white to-rose-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={socialToken.google}
                  onChange={(e) => setSocialToken((prev) => ({ ...prev, google: e.target.value }))}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                  placeholder="Paste Google ID token"
                />
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={isSocialLoading !== null}
                  className="flex items-center justify-center px-4 py-2 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  {isSocialLoading === 'google' ? '...' : 'Google'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={socialToken.apple}
                  onChange={(e) => setSocialToken((prev) => ({ ...prev, apple: e.target.value }))}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                  placeholder="Paste Apple identity token"
                />
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('apple')}
                  disabled={isSocialLoading !== null}
                  className="flex items-center justify-center px-4 py-2 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  {isSocialLoading === 'apple' ? '...' : 'Apple'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
