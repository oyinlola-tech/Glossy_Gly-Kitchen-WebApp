import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  expiresAt: string;
  maxUses?: number;
  usedCount?: number;
}

export const Coupons: React.FC = () => {
  const { token } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiresAt: '',
    maxUses: '',
  });
  const ngnFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  });

  useEffect(() => {
    loadCoupons();
  }, [token]);

  const loadCoupons = async () => {
    if (!token) return;

    try {
      const response = await apiService.getCoupons(token);
      setCoupons(response);
    } catch (error: any) {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const data = {
      code: formData.code ? formData.code.toUpperCase() : undefined,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      maxRedemptions: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
    };

    try {
      await apiService.createCoupon(token, data);
      toast.success('Coupon created successfully');
      setIsModalOpen(false);
      setFormData({ code: '', discountType: 'percentage', discountValue: '', expiresAt: '', maxUses: '' });
      loadCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Coupons Management</h2>
          <p className="text-slate-600">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-slate-500">
                {coupon.usedCount || 0}/{coupon.maxUses || '∞'}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-2xl font-bold font-mono mb-2">{coupon.code}</h3>
              <p className="text-slate-600">
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}% off`
                  : `${ngnFormatter.format(coupon.discountValue)} off`}
              </p>
            </div>

            <div className="text-sm text-slate-500">
              <p>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-600">No coupons created yet</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-6">Create Coupon</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="SAVE20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(NGN)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expires At *</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max Uses (Optional)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="Unlimited"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
