import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

interface DisputeRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
}

export const Disputes: React.FC = () => {
  const { token } = useAdminAuth();
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: '' });
  const [isCreating, setIsCreating] = useState(false);

  const loadDisputes = async () => {
    if (!token) return;
    try {
      const response = await apiService.getDisputes(token);
      setDisputes(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreating(true);
    try {
      await apiService.createDispute(token, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category.trim() || undefined,
      });
      toast.success('Dispute created');
      setForm({ title: '', description: '', priority: 'medium', category: '' });
      await loadDisputes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dispute');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    const resolutionNotes = window.prompt('Enter resolution notes');
    if (!resolutionNotes) return;
    try {
      await apiService.resolveDispute(token, id, { resolutionNotes });
      toast.success('Dispute resolved');
      await loadDisputes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Disputes</h2>
        <p className="text-slate-600">Track and resolve operational disputes.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Title"
          className="border border-slate-300 rounded-lg px-3 py-2"
          required
        />
        <input
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description"
          className="border border-slate-300 rounded-lg px-3 py-2"
          required
        />
        <select
          value={form.priority}
          onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
          className="border border-slate-300 rounded-lg px-3 py-2"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          placeholder="Category"
          className="border border-slate-300 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={isCreating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Dispute'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Title</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Priority</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Created</th>
                <th className="text-right px-6 py-4 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {disputes.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{row.title}</td>
                  <td className="px-6 py-4">{row.status}</td>
                  <td className="px-6 py-4 capitalize">{row.priority}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    {(row.status === 'open' || row.status === 'investigating') && (
                      <button
                        onClick={() => handleResolve(row.id)}
                        className="text-sm px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {disputes.length === 0 && (
        <div className="text-center py-10 text-slate-500">No disputes found.</div>
      )}
    </div>
  );
};
