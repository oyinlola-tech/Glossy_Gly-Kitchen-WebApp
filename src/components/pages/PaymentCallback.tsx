import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

export const PaymentCallback: React.FC = () => {
  const { token, setAuthData } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verify = async () => {
      const reference = params.get('reference') || params.get('trxref');
      if (!reference) {
        toast.error('Payment reference missing');
        navigate('/menu');
        return;
      }

      let activeToken = token;
      if (!activeToken) {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshed = await apiService.refreshAuth(refreshToken);
            if (refreshed?.token && refreshed?.refreshToken) {
              const profile = await apiService.getMe(refreshed.token);
              setAuthData({
                user: profile?.user || profile,
                token: refreshed.token,
                refreshToken: refreshed.refreshToken,
              }, false);
              activeToken = refreshed.token;
            }
          } catch {
            activeToken = null;
          }
        }
      }

      if (!activeToken) {
        toast.error('Please login to complete payment verification');
        navigate('/login', { state: { next: `${location.pathname}${location.search}` } });
        return;
      }

      try {
        const result: any = await apiService.verifyPayment(activeToken, reference);
        if (result?.status === 'success') {
          setMessage('Payment verified successfully.');
          toast.success('Payment successful');
        } else {
          setMessage(`Payment status: ${result?.status || 'unknown'}`);
          toast.info(`Payment status: ${result?.status || 'unknown'}`);
        }
      } catch (error: any) {
        setMessage(error.message || 'Payment verification failed');
        toast.error(error.message || 'Payment verification failed');
      } finally {
        setTimeout(() => navigate('/orders'), 1500);
      }
    };

    verify();
  }, [token, params, navigate, location.pathname, location.search, setAuthData]);

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-3xl font-serif mb-4">Payment Callback</h1>
      <p className="text-slate-600">{message}</p>
    </div>
  );
};
