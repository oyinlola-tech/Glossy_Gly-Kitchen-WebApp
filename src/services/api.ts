import { API_CONFIG } from '../config/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  private asArray<T>(value: any): T[] {
    return Array.isArray(value) ? value : [];
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

  async getFoods() {
    const response = await this.request(API_CONFIG.ENDPOINTS.FOODS, { method: 'GET' });
    return this.asArray(response);
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

  async createOrder(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'POST',
      token,
    });

    return {
      ...response,
      id: response?.id || response?.orderId,
      total: Number(response?.total ?? 0),
    };
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

  async getSavedCards(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.PAYMENTS.CARDS, {
      method: 'GET',
      token,
    });
    return this.asArray(response?.cards || response);
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

  async getAdminDashboard(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD, {
      method: 'GET',
      token,
    });

    return {
      totalRevenue: Number(response?.orders?.gross_order_value ?? 0),
      totalOrders: Number(response?.orders?.total_orders ?? 0),
      totalUsers: Number(response?.users?.total_users ?? 0),
      revenueGrowth: 0,
      raw: response,
    };
  }

  async adminCreateFood(token: string, data: { name: string; price: number; description?: string; category?: string }) {
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

  async getDisputes(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.DISPUTES, {
      method: 'GET',
      token,
    });
    return this.asArray(response?.disputes || response);
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

  async getAuditLogs(token: string) {
    const response: any = await this.request(API_CONFIG.ENDPOINTS.ADMIN.AUDIT_LOGS, {
      method: 'GET',
      token,
    });
    return this.asArray(response?.logs || response);
  }
}

export const apiService = new ApiService();
