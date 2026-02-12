import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiService } from '../../services/api';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiService.requestPasswordReset(email);
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.verifyPasswordResetOtp({ email, otp: otpCode });
      setResetToken(response.resetToken);
      toast.success('OTP verified');
      setStep('reset');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.resetPassword({ resetToken, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }
    setIsLoading(true);
    try {
      await apiService.requestPasswordReset(email);
      toast.success('OTP resent to your email');
      setOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);

    if (numeric && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-rose-500/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1498654896293-37aacf113fd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwcGxhdGV8ZW58MXx8fHwxNzcwOTc1OTg5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Elegant dining plate"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-4xl font-serif text-white mb-4">
            Secure Account Recovery
          </h2>
          <p className="text-xl text-white/90">
            Regain access and continue your culinary journey
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col p-8 bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <button
          onClick={() => step === 'email' ? navigate('/login') : setStep(step === 'otp' ? 'email' : 'otp')}
          className="self-start flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 mb-4">
              {step === 'reset' ? <Lock className="w-8 h-8 text-white" /> : <Mail className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-serif mb-2 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              {step === 'email' && 'Reset Password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'New Password'}
            </h1>
            <p className="text-gray-600">
              {step === 'email' && "Enter your email to receive a reset code"}
              {step === 'otp' && `We've sent a code to ${email}`}
              {step === 'reset' && 'Create your new password'}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
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
                    placeholder="oluwayemioyinlola2@gmail.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
