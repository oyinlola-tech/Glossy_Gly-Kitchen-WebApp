import { API_CONFIG } from '../config/api';

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRetry?: boolean;
}

export interface SavedCardDto {
  id: string;
  bank?: string;
  card_type?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  is_default?: number;
}

export interface UserAddressDto {
  id: string;
  label?: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  notes?: string;
  is_default?: number;
}

export interface DisputeDto {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
}

export interface AuditLogDto {
  id: string;
  action: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  created_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, skipAuthRetry, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    } catch (error) {
      const fallbackBase = this.baseUrl || 'configured API base URL';
      const message = error instanceof Error ? error.message : 'Network error';
      throw new Error(`Cannot reach API server (${fallbackBase}). ${message}`);
    }

    const payload = await response.json().catch(() => ({}));

    if (
      response.status === 401 &&
      token &&
      !skipAuthRetry &&
      !endpoint.includes('/refresh') &&
      !endpoint.includes('/logout')
    ) {
      const refreshed = await this.tryRefreshSession(endpoint.startsWith('/admin'));
      if (refreshed?.token) {
        return this.request<T>(endpoint, {
          ...options,
          token: refreshed.token,
          skipAuthRetry: true,
        });
      }
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  private getTokenStorageKeys(isAdmin: boolean) {
    return isAdmin
      ? { token: 'adminToken', refreshToken: 'adminRefreshToken', user: 'admin' }
      : { token: 'token', refreshToken: 'refreshToken', user: 'user' };
  }

  private getStoredValue(key: string) {
    return sessionStorage.getItem(key);
  }

  private setStoredValue(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  private async tryRefreshSession(isAdmin: boolean): Promise<{ token: string; refreshToken: string } | null> {
    const keys = this.getTokenStorageKeys(isAdmin);
    const refreshToken = this.getStoredValue(keys.refreshToken);
    if (!refreshToken) {
      return null;
    }

    try {
      const endpoint = isAdmin ? API_CONFIG.ENDPOINTS.ADMIN.AUTH.REFRESH : API_CONFIG.ENDPOINTS.AUTH.REFRESH;
      const response: any = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuthRetry: true,
      });

      const token = response?.token || response?.accessToken;
      const nextRefreshToken = response?.refreshToken;
      if (!token || !nextRefreshToken) {
        return null;
      }

      this.setStoredValue(keys.token, token);
      this.setStoredValue(keys.refreshToken, nextRefreshToken);
      window.dispatchEvent(new CustomEvent('auth:session-updated', { detail: { isAdmin } }));

      return { token, refreshToken: nextRefreshToken };
    } catch {
      return null;
    }
  }

  private asArray<T>(value: any): T[] {
    return Array.isArray(value) ? value : [];
  }

  private resolveImageUrl(value?: string): string | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }

    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (!this.baseUrl) {
      return normalizedPath;
    }

    try {
      const resolved = new URL(normalizedPath, this.baseUrl);
      return resolved.toString();
    } catch {
      return normalizedPath;
    }
  }

  private mapUserAuth(data: any) {
    return {
      ...data,
      token: data?.token || data?.accessToken,
      refreshToken: data?.refreshToken,
      user: data?.user,
    };
  }

  private mapAdminAuth(data: any) {
    return {
      ...data,
      token: data?.token || data?.accessToken,
      refreshToken: data?.refreshToken,
      admin: data?.admin,
    };
  }

  async signup(data: { email: string; password: string; phone?: string; referralCode?: string }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOtp(data: { userId: string; otp: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapUserAuth(response);
  }

  async resendOtp(email: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(data: { email: string; password: string; deviceId?: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapUserAuth(response);
  }

  async loginWithGoogle(data: { idToken: string; deviceId?: string; referralCode?: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.GOOGLE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapUserAuth(response);
  }

  async loginWithApple(data: { identityToken: string; deviceId?: string; referralCode?: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.APPLE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapUserAuth(response);
  }

  async requestLoginOtp(email: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REQUEST_LOGIN_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async loginWithOtp(data: { email: string; otp: string; deviceId?: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN_OTP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapUserAuth(response);
  }

  async requestPasswordReset(email: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyPasswordResetOtp(data: { email: string; otp: string }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: { resetToken: string; newPassword: string }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.ME, {
      method: 'GET',
      token,
    });
  }

  async updateProfile(token: string, data: { phone?: string; currentPassword?: string; newPassword?: string }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.ME, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    });
  }

  async generateReferralCode(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REFERRAL_CODE_GENERATE, {
      method: 'POST',
      token,
    });
  }

  async logout(token: string, refreshToken: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      token,
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logoutAll(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT_ALL, {
      method: 'POST',
      token,
    });
  }

  async refreshAuth(refreshToken: string) {
    const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuthRetry: true,
    });
    return this.mapUserAuth(response);
  }

  async requestAccountDeletionOtp(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.DELETE_ACCOUNT_REQUEST_OTP, {
      method: 'POST',
      token,
    });
  }

  async deleteAccount(token: string, otp: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.DELETE_ACCOUNT, {
      method: 'DELETE',
      token,
      body: JSON.stringify({ otp }),
    });
  }

  async getFoods() {
    const response = await this.request(API_CONFIG.ENDPOINTS.FOODS, { method: 'GET' });
    return this.asArray(response).map((food: any) => ({
      ...food,
      price: Number(food.price ?? 0),
      categoryId: food.categoryId || food.category_id || null,
      imageUrl: this.resolveImageUrl(food.imageUrl || food.image_url),
      currency: (food.currency || 'NGN').toUpperCase(),
      available: food.available !== undefined ? Boolean(food.available) : true,
    }));
  }

  async getAdminFoods(token: string) {
    const response = await this.request(API_CONFIG.ENDPOINTS.ADMIN.FOODS_ALL, {
      method: 'GET',
      token,
    });
    return this.asArray(response).map((food: any) => ({
      ...food,
      price: Number(food.price ?? 0),
      categoryId: food.categoryId || food.category_id || null,
      imageUrl: this.resolveImageUrl(food.imageUrl || food.image_url),
      currency: (food.currency || 'NGN').toUpperCase(),
      available: food.available !== undefined ? Boolean(food.available) : true,
    }));
  }

  async getFoodCategories() {
    const response = await this.request(API_CONFIG.ENDPOINTS.FOOD_CATEGORIES, {
      method: 'GET',
    });
    return this.asArray(response).map((category: any) => ({
      ...category,
      foodCount: Number(category.foodCount ?? category.food_count ?? 0),
    }));
  }

  async createFoodCategory(token: string, name: string) {
    return this.request(API_CONFIG.ENDPOINTS.FOOD_CATEGORIES, {
      method: 'POST',
      token,
      body: JSON.stringify({ name }),
    });
  }

  async updateFoodCategory(token: string, id: string, name: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.FOOD_CATEGORIES}/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ name }),
    });
  }

  async deleteFoodCategory(token: string, id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.FOOD_CATEGORIES}/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async getFood(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.FOODS}/${id}`, { method: 'GET' });
  }

  async addToCart(token: string, data: { foodId: string; quantity: number }) {
    return this.request(API_CONFIG.ENDPOINTS.CART, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getCart(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.CART, {
      method: 'GET',
      token,
    });

    return {
      ...response,
      items: this.asArray(response?.items).map((item: any) => ({
        foodId: item.foodId || item.food_id,
        quantity: Number(item.quantity || 0),
        food: {
          id: item.foodId || item.food_id,
          name: item.food?.name || item.name || 'Unknown item',
          price: Number(item.food?.price ?? item.price ?? 0),
          description: item.food?.description || item.description,
        },
      })),
    };
  }

  async updateCart(token: string, data: { foodId: string; quantity: number }) {
    return this.request(API_CONFIG.ENDPOINTS.CART, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async clearCart(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.CART, {
      method: 'DELETE',
      token,
    });
  }

  async createOrder(token: string, data?: {
    addressId?: string;
    deliveryAddress?: {
      label?: string;
      recipientName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
      notes?: string;
    };
    saveAddress?: boolean;
    saveAsDefault?: boolean;
  }) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'POST',
      token,
      body: JSON.stringify(data || {}),
    });

    return {
      ...response,
      id: response?.id || response?.orderId,
      total: Number(response?.total ?? 0),
    };
  }

  async getUserAddresses(token: string): Promise<UserAddressDto[]> {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ORDER_ADDRESSES, {
      method: 'GET',
      token,
    });
    return this.asArray<UserAddressDto>(response?.addresses || response);
  }

  async createUserAddress(token: string, data: any) {
    return this.request(API_CONFIG.ENDPOINTS.ORDER_ADDRESSES, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updateUserAddress(token: string, addressId: string, data: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDER_ADDRESSES}/${addressId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteUserAddress(token: string, addressId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDER_ADDRESSES}/${addressId}`, {
      method: 'DELETE',
      token,
    });
  }

  async getOrders(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'GET',
      token,
    });

    return this.asArray(response?.orders || response).map((order: any) => ({
      ...order,
      total: Number(order.total ?? order.total_amount ?? order.payable_amount ?? 0),
      createdAt: order.createdAt || order.created_at,
    }));
  }

  async getOrder(token: string, id: string) {
    const response: any = await this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}`, {
      method: 'GET',
      token,
    });

    return {
      ...response,
      total: Number(response.total ?? response.total_amount ?? response.payable_amount ?? 0),
      discountAmount: Number(response.discountAmount ?? response.discount_amount ?? 0),
      payableAmount: Number(response.payableAmount ?? response.payable_amount ?? response.total_amount ?? 0),
      createdAt: response.createdAt || response.created_at,
    };
  }

  async applyCoupon(token: string, orderId: string, couponCode: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/coupon/apply`, {
      method: 'POST',
      token,
      body: JSON.stringify({ couponCode }),
    });
  }

  async validateCoupon(token: string, orderId: string, couponCode: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/coupon/validate`, {
      method: 'POST',
      token,
      body: JSON.stringify({ couponCode }),
    });
  }

  async removeCoupon(token: string, orderId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/coupon`, {
      method: 'DELETE',
      token,
    });
  }

  async cancelOrder(token: string, orderId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/cancel`, {
      method: 'POST',
      token,
    });
  }

  async initializePayment(token: string, data: { orderId: string; callbackUrl?: string; saveCard?: boolean }) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.PAYMENTS.INITIALIZE, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });

    return {
      ...response,
      authorizationUrl: response.authorizationUrl || response.authorization_url,
      accessCode: response.accessCode || response.access_code,
    };
  }

  async verifyPayment(token: string, reference: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY}/${reference}`, {
      method: 'GET',
      token,
    });
  }

  async getSavedCards(token: string): Promise<SavedCardDto[]> {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.PAYMENTS.CARDS, {
      method: 'GET',
      token,
    });
    return this.asArray<SavedCardDto>(response?.cards || response);
  }

  async saveCardFromReference(token: string, reference: string) {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS.CARDS, {
      method: 'POST',
      token,
      body: JSON.stringify({ reference }),
    });
  }

  async setDefaultSavedCard(token: string, cardId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PAYMENTS.CARD_SET_DEFAULT}/${cardId}/default`, {
      method: 'PATCH',
      token,
    });
  }

  async deleteSavedCard(token: string, cardId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PAYMENTS.CARDS}/${cardId}`, {
      method: 'DELETE',
      token,
    });
  }

  async payWithSavedCard(token: string, data: { orderId: string; cardId: string }) {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS.PAY_WITH_SAVED_CARD, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async adminLogin(data: { email: string; password: string; otp?: string; deviceId?: string; deviceLabel?: string }) {
    const response = await this.request(API_CONFIG.ENDPOINTS.ADMIN.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapAdminAuth(response);
  }

  async getAdminMe(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.ME, {
      method: 'GET',
      token,
    });
  }

  async adminLogout(token: string, refreshToken: string) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.AUTH.LOGOUT, {
      method: 'POST',
      token,
      body: JSON.stringify({ refreshToken }),
    });
  }

  async adminLogoutAll(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.AUTH.LOGOUT_ALL, {
      method: 'POST',
      token,
    });
  }

  async adminRefreshAuth(refreshToken: string) {
    const response = await this.request(API_CONFIG.ENDPOINTS.ADMIN.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuthRetry: true,
    });
    return this.mapAdminAuth(response);
  }

  async getAdminDashboard(token: string, period: 'weekly' | 'monthly' | 'yearly' = 'weekly') {
    const response: any = await this.request(`${API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD}?period=${period}`, {
      method: 'GET',
      token,
    });

    return {
      totalRevenue: Number(response?.orders?.amount_made ?? response?.orders?.gross_order_value ?? 0),
      totalOrders: Number(response?.orders?.total_orders ?? 0),
      totalUsers: Number(response?.users?.total_users ?? 0),
      revenueGrowth: 0,
      currency: response?.orders?.currency || 'NGN',
      reports: response?.reports || { period, sales: [], topMeals: [] },
      raw: response,
    };
  }

  async adminCreateFood(token: string, data: {
    name: string;
    price: number;
    description?: string;
    categoryId?: string;
    category?: string;
    currency?: string;
    imageDataUrl?: string;
    imageFileName?: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.FOODS, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async adminUpdateFood(token: string, id: string, data: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.FOODS}/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async adminDeleteFood(token: string, id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.FOODS}/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async getAdminUsers(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.USERS, {
      method: 'GET',
      token,
    });

    return this.asArray(response?.users || response).map((user: any) => ({
      ...user,
      status: user.is_suspended ? 'suspended' : 'active',
      createdAt: user.createdAt || user.created_at,
    }));
  }

  async getAdminUser(token: string, id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${id}`, {
      method: 'GET',
      token,
    });
  }

  async updateUserStatus(token: string, id: string, status: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ isSuspended: status === 'suspended' }),
    });
  }

  async getAdminOrders(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.ORDERS, {
      method: 'GET',
      token,
    });

    return this.asArray(response?.orders || response).map((order: any) => ({
      ...order,
      total: Number(order.total ?? order.total_amount ?? order.payable_amount ?? 0),
      createdAt: order.createdAt || order.created_at,
      user: {
        email: order.user?.email || order.email,
      },
      delivery: {
        recipientName: order.delivery_recipient_name,
        phone: order.delivery_phone,
        addressLine1: order.delivery_address_line1,
        addressLine2: order.delivery_address_line2,
        city: order.delivery_city,
        state: order.delivery_state,
        country: order.delivery_country,
        postalCode: order.delivery_postal_code,
        notes: order.delivery_notes,
      },
    }));
  }

  async getAdminOrder(token: string, id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.ORDERS}/${id}`, {
      method: 'GET',
      token,
    });
  }

  async updateOrderStatus(token: string, id: string, status: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.ORDERS}/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
  }

  async createCoupon(token: string, data: any) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.COUPONS, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getCoupons(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.COUPONS, {
      method: 'GET',
      token,
    });

    return this.asArray(response?.coupons || response).map((coupon: any) => ({
      ...coupon,
      discountType: coupon.discountType || coupon.discount_type,
      discountValue: Number(coupon.discountValue ?? coupon.discount_value ?? 0),
      expiresAt: coupon.expiresAt || coupon.expires_at,
      maxUses: coupon.maxUses ?? coupon.max_redemptions,
      usedCount: coupon.usedCount ?? coupon.redemptions_count,
    }));
  }

  async createReferralCode(token: string, data: any) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.REFERRAL_CODES, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getReferralCodes(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.REFERRAL_CODES, {
      method: 'GET',
      token,
    });
    return this.asArray(response?.referralCodes || response);
  }

  async getDisputes(token: string): Promise<DisputeDto[]> {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.DISPUTES, {
      method: 'GET',
      token,
    });
    return this.asArray<DisputeDto>(response?.disputes || response);
  }

  async createDispute(token: string, data: any) {
    return this.request(API_CONFIG.ENDPOINTS.ADMIN.DISPUTES, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getDispute(token: string, id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.DISPUTES}/${id}`, {
      method: 'GET',
      token,
    });
  }

  async updateDispute(token: string, id: string, data: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.DISPUTES}/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    });
  }

  async resolveDispute(token: string, id: string, data: any) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.DISPUTES}/${id}/resolve`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async addDisputeComment(token: string, id: string, data: { comment: string; isInternal?: boolean }) {
    return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.DISPUTES}/${id}/comments`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(token: string): Promise<AuditLogDto[]> {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.AUDIT_LOGS, {
      method: 'GET',
      token,
    });
    return this.asArray<AuditLogDto>(response?.logs || response);
  }
}

export const apiService = new ApiService();
