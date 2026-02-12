import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CreditCard, Tag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  total: number;
  status: string;
  items: any[];
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!token || !orderId) return;

    try {
      const response = await apiService.getOrder(token, orderId);
      setOrder(response);
    } catch (error: any) {
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!token || !orderId || !couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      await apiService.applyCoupon(token, orderId, couponCode);
      toast.success('Coupon applied successfully!');
      loadOrder();
      setCouponCode('');
    } catch (error: any) {
      toast.error(error.message || 'Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!token || !orderId) return;

    setIsProcessing(true);
    try {
      const callbackUrl = window.location.origin.startsWith('https://')
        ? `${window.location.origin}/payment/callback`
        : undefined;

      const response = await apiService.initializePayment(token, {
        orderId,
        callbackUrl,
      });

      // Redirect to payment gateway
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
      } else {
        toast.success('Payment initialized successfully!');
        navigate('/orders');
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Order not found</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-4 text-amber-600 hover:text-amber-700"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </button>

      <h1 className="text-4xl font-serif mb-8 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="capitalize">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              Apply Coupon
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                {isApplyingCoupon ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${((order.total || 0) * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-semibold">
                <span>Total</span>
                <span className="text-amber-600">
                  ${((order.total || 0) * 1.1).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white py-4 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50 font-medium text-lg"
            >
              <CreditCard className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
