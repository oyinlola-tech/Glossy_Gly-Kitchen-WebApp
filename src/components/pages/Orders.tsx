import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: any[];
}

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getOrders(token);
      setOrders(response);
    } catch (error: any) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'confirmed':
      case 'preparing':
      case 'out_for_delivery':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Package className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'confirmed':
      case 'preparing':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 flex items-center justify-center">
          <Package className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-3xl font-serif mb-4">No orders yet</h2>
        <p className="text-gray-600 mb-8">
          Start your culinary journey by placing your first order
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-8 py-3 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif mb-2 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
          Order History
        </h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-amber-100 to-rose-100 rounded-xl">
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                <p className="text-2xl font-semibold text-amber-600">
                  ${order.total?.toFixed(2) || '0.00'}
                </p>
              </div>

              <button
                onClick={() => navigate(`/checkout/${order.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
