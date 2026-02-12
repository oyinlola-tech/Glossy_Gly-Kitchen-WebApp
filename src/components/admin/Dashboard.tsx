import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  currency: string;
  reports: {
    period: 'weekly' | 'monthly' | 'yearly';
    sales: Array<{ label: string; orders: number; amount: number }>;
    topMeals: Array<{ id: string; name: string; quantitySold: number; revenue: number }>;
  };
}

export const Dashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const ngnFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
      }),
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [token, period]);

  const loadDashboard = async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const response = await apiService.getAdminDashboard(token, period);
      setStats(response);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Amount Made',
      value: ngnFormatter.format(stats?.totalRevenue || 0),
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'from-purple-50 to-pink-50',
    },
    {
      title: 'Report Window',
      value: period.charAt(0).toUpperCase() + period.slice(1),
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'from-amber-50 to-orange-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-serif mb-2">Dashboard Overview</h2>
          <p className="text-slate-600">Sales, order performance, and meal trends (NGN)</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
          className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
        >
          <option value="weekly">Weekly Report</option>
          <option value="monthly">Monthly Report</option>
          <option value="yearly">Yearly Report</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`bg-gradient-to-br ${card.bg} rounded-2xl p-6 border border-slate-200`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${card.gradient} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-slate-900 break-words">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="text-xl font-semibold mb-4">Sales Chart ({period})</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.reports?.sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value: number) => ngnFormatter.format(Number(value || 0))} />
                <Bar dataKey="amount" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="text-xl font-semibold mb-4">Top Meals</h3>
          <div className="space-y-3">
            {(stats?.reports?.topMeals || []).length === 0 && (
              <p className="text-slate-500 text-sm">No completed meal sales yet.</p>
            )}
            {(stats?.reports?.topMeals || []).map((meal, index) => (
              <div key={meal.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-medium text-slate-900">{index + 1}. {meal.name}</p>
                <p className="text-sm text-slate-600">Sold: {meal.quantitySold}</p>
                <p className="text-sm text-emerald-700 font-medium">{ngnFormatter.format(meal.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
