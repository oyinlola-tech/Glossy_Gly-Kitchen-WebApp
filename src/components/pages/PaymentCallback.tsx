import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

export const PaymentCallback: React.FC = () => {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verify = async () => {
      const reference = params.get('reference') || params.get('trxref');
      if (!token) {
        toast.error('Authentication required');
        navigate('/orders');
        return;
      }
      if (!reference) {
        toast.error('Payment reference missing');
        navigate('/orders');
        return;
      }

      try {
        const result: any = await apiService.verifyPayment(token, reference);
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
  }, [token, params, navigate]);

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-3xl font-serif mb-4">Payment Callback</h1>
      <p className="text-slate-600">{message}</p>
    </div>
  );
};
