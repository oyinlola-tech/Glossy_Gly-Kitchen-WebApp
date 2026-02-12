import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

interface DisputeRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  assigned_admin_id?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  comments?: Array<{
    id: string;
    comment: string;
    is_internal: number;
    created_at: string;
    author_type: string;
  }>;
}

export const Disputes: React.FC = () => {
  const { token } = useAdminAuth();
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'medium', category: '' });
  const [updateForm, setUpdateForm] = useState({
    status: 'open',
    priority: 'medium',
    category: '',
    resolutionNotes: '',
  });
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(true);

  const selectedListItem = useMemo(
    () => disputes.find((d) => d.id === selectedId) || null,
    [disputes, selectedId]
  );

  const loadDisputes = async () => {
    if (!token) return;
    try {
      const response = await apiService.getDisputes(token);
      setDisputes(response);
      if (!selectedId && response.length > 0) {
        setSelectedId(response[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDisputeDetails = async (id: string) => {
    if (!token) return;
    try {
      const details = await apiService.getDispute(token, id);
      setSelectedDispute(details);
      setUpdateForm({
        status: details?.status || 'open',
        priority: details?.priority || 'medium',
        category: details?.category || '',
        resolutionNotes: details?.resolution_notes || '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dispute details');
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [token]);

  useEffect(() => {
    if (selectedId) {
      loadDisputeDetails(selectedId);
    } else {
      setSelectedDispute(null);
    }
  }, [selectedId, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreating(true);
    try {
      await apiService.createDispute(token, {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        priority: createForm.priority,
        category: createForm.category.trim() || undefined,
      });
      toast.success('Dispute created');
      setCreateForm({ title: '', description: '', priority: 'medium', category: '' });
      await loadDisputes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dispute');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedId) return;
    setIsUpdating(true);
    try {
      await apiService.updateDispute(token, selectedId, {
        status: updateForm.status,
        priority: updateForm.priority,
        category: updateForm.category || null,
        resolutionNotes: updateForm.resolutionNotes || null,
      });
      toast.success('Dispute updated');
      await Promise.all([loadDisputes(), loadDisputeDetails(selectedId)]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update dispute');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedId || !commentText.trim()) return;
    setIsAddingComment(true);
    try {
      await apiService.addDisputeComment(token, selectedId, {
        comment: commentText.trim(),
        isInternal: commentInternal,
      });
      setCommentText('');
      toast.success('Comment added');
      await loadDisputeDetails(selectedId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleResolve = async () => {
    if (!token || !selectedId) return;
    const resolutionNotes = updateForm.resolutionNotes.trim();
    if (!resolutionNotes) {
      toast.error('Resolution notes are required to resolve');
      return;
    }
    setIsUpdating(true);
    try {
      await apiService.resolveDispute(token, selectedId, { resolutionNotes });
      toast.success('Dispute resolved');
      await Promise.all([loadDisputes(), loadDisputeDetails(selectedId)]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve dispute');
    } finally {
      setIsUpdating(false);
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
        <p className="text-slate-600">Create, inspect, update, resolve, and comment on disputes.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={createForm.title}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Title"
          className="border border-slate-300 rounded-lg px-3 py-2"
          required
        />
        <input
          value={createForm.description}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description"
          className="border border-slate-300 rounded-lg px-3 py-2"
          required
        />
        <select
          value={createForm.priority}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value }))}
          className="border border-slate-300 rounded-lg px-3 py-2"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          value={createForm.category}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-semibold">Open Cases</div>
          <div className="max-h-[620px] overflow-y-auto">
            {disputes.length === 0 && <div className="p-4 text-slate-500">No disputes found.</div>}
            {disputes.map((row) => (
              <button
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${selectedId === row.id ? 'bg-purple-50' : ''}`}
              >
                <p className="font-medium text-slate-900">{row.title}</p>
                <p className="text-xs text-slate-600 mt-1">{row.status} • {row.priority}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedDispute && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
              Select a dispute to view details.
            </div>
          )}

          {selectedDispute && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xl font-semibold mb-2">{selectedDispute.title}</h3>
                <p className="text-slate-600 mb-2">{selectedDispute.description || 'No description'}</p>
                <p className="text-xs text-slate-500">
                  ID: {selectedDispute.id} • Created: {new Date(selectedDispute.created_at).toLocaleString()}
                </p>
              </div>

              <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h4 className="font-semibold">Update Dispute</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={updateForm.priority}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    value={updateForm.category}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Category"
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <textarea
                  value={updateForm.resolutionNotes}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, resolutionNotes: e.target.value }))}
                  placeholder="Resolution notes"
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Updates'}
                  </button>
                  {(selectedListItem?.status === 'open' || selectedListItem?.status === 'investigating') && (
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isUpdating ? 'Resolving...' : 'Resolve Dispute'}
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h4 className="font-semibold">Comments</h4>
                <form onSubmit={handleAddComment} className="space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment"
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={commentInternal}
                      onChange={(e) => setCommentInternal(e.target.checked)}
                    />
                    Internal comment
                  </label>
                  <div>
                    <button
                      type="submit"
                      disabled={isAddingComment || !commentText.trim()}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isAddingComment ? 'Posting...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
                <div className="space-y-3">
                  {(selectedDispute.comments || []).length === 0 && (
                    <p className="text-slate-500 text-sm">No comments yet.</p>
                  )}
                  {(selectedDispute.comments || []).map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <p className="text-slate-800">{comment.comment}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {comment.author_type} • {comment.is_internal ? 'internal' : 'public'} • {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
