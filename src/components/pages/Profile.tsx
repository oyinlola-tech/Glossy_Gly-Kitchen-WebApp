import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { User, Phone, Lock, Mail, Gift } from 'lucide-react';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [referralCode, setReferralCode] = useState<string | undefined>(user?.referralCode);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [requestingDeleteOtp, setRequestingDeleteOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleUpdatePhone = async () => {
    if (!token) return;

    setIsUpdating(true);
    try {
      await apiService.updateProfile(token, { phone });
      toast.success('Phone number updated successfully');
      setIsEditingPhone(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update phone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!token) return;

    setIsUpdating(true);
    try {
      await apiService.updateProfile(token, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    if (!token) return;

    try {
      const response = await apiService.generateReferralCode(token);
      if (response?.referralCode) {
        setReferralCode(response.referralCode);
      }
      toast.success('Referral code generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate referral code');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif mb-2 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="p-3 bg-gray-50 rounded-xl text-gray-900">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditingPhone ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                    placeholder="+1 (555) 000-0000"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePhone}
                      disabled={isUpdating}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-rose-600 text-white py-2 rounded-xl hover:from-amber-700 hover:to-rose-700 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhone(user?.phone || '');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-900">{phone || 'Not set'}</span>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Security</h2>
          </div>

          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 border-t pt-5 space-y-2">
            <button
              type="button"
              onClick={async () => {
                if (!token) return;
                try {
                  await apiService.logoutAll(token);
                  await logout();
                  toast.success('Logged out of all sessions');
                } catch (error: any) {
                  toast.error(error.message || 'Failed to logout all sessions');
                }
              }}
              className="w-full bg-slate-100 text-slate-800 py-2 rounded-xl hover:bg-slate-200 transition-all"
            >
              Logout All Sessions
            </button>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-white rounded-2xl p-6 shadow-lg md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Referral Program</h2>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl">
            <p className="text-gray-700 mb-4">
              Invite your friends and earn rewards! Share your referral code and get exclusive benefits.
            </p>
            {(referralCode || user?.referralCode) ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 bg-white rounded-xl border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
                  <p className="text-2xl font-bold text-green-600">{referralCode || user?.referralCode}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode || user?.referralCode || '');
                    toast.success('Referral code copied!');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all"
                >
                  Copy Code
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateReferralCode}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all"
              >
                Generate Referral Code
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg md:col-span-2 border border-rose-100">
          <h2 className="text-xl font-semibold mb-2 text-rose-700">Danger Zone</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Deleting your account is permanent and cannot be undone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!token) return;
                setRequestingDeleteOtp(true);
                try {
                  await apiService.requestAccountDeletionOtp(token);
                  toast.success('Deletion OTP sent to your email');
                } catch (error: any) {
                  toast.error(error.message || 'Failed to send deletion OTP');
                } finally {
                  setRequestingDeleteOtp(false);
                }
              }}
              disabled={requestingDeleteOtp}
              className="bg-rose-100 text-rose-700 py-2 px-3 rounded-xl hover:bg-rose-200 disabled:opacity-50"
            >
              {requestingDeleteOtp ? 'Sending OTP...' : 'Request Deletion OTP'}
            </button>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="border-2 border-rose-200 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!token || deleteOtp.length !== 6) {
                  toast.error('Enter the 6-digit OTP');
                  return;
                }
                if (!confirm('Delete your account permanently?')) return;
                setDeletingAccount(true);
                try {
                  await apiService.deleteAccount(token, deleteOtp);
                  await logout();
                  toast.success('Account deleted');
                } catch (error: any) {
                  toast.error(error.message || 'Failed to delete account');
                } finally {
                  setDeletingAccount(false);
                }
              }}
              disabled={deletingAccount}
              className="bg-rose-600 text-white py-2 px-3 rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {deletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
