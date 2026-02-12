import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { apiService } from '../../services/api';

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();
  const { userId, email } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);

    if (numeric && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    if (!userId) {
      toast.error('Invalid verification session');
      return;
    }

    setIsLoading(true);

    try {
      await verifyOtp(userId, otpCode);
      toast.success('Account verified successfully!');
      navigate('/menu');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found');
      return;
    }

    setIsResending(true);

    try {
      await apiService.resendOtp(email);
      toast.success('OTP resent successfully!');
      setOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-rose-500/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1617093727343-374698b1b08d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGRpbm5lcnxlbnwxfHx8fDE3NzA5NzU5ODl8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Elegant restaurant dinner"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-4xl font-serif text-white mb-4">
            One Step Away
          </h2>
          <p className="text-xl text-white/90">
            Verify your account and start ordering
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-serif mb-2 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              We've sent a verification code to
              <br />
              <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend Code'}
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
