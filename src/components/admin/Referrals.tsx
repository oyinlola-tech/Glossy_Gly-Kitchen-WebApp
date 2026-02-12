import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

interface ReferralRow {
  user_id: string;
  email: string;
  referral_code: string;
  referred_customers: number;
  referred_orders_count: number;
  updated_at: string;
}

export const Referrals: React.FC = () => {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const response = await apiService.getReferralCodes(token);
        setRows(response);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load referral codes');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Referrals</h2>
        <p className="text-slate-600">Active user referral codes and outcomes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">User</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Code</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Referred Users</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Referred Orders</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.user_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{row.email || row.user_id}</td>
                  <td className="px-6 py-4 font-mono font-semibold">{row.referral_code}</td>
                  <td className="px-6 py-4">{Number(row.referred_customers || 0)}</td>
                  <td className="px-6 py-4">{Number(row.referred_orders_count || 0)}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(row.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-10 text-slate-500">No referral codes found.</div>
      )}
    </div>
  );
};
