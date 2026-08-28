import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('grocgo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('grocgo_token');
      localStorage.removeItem('grocgo_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
};

// ─── STORE ───────────────────────────────────────────────────
export const storeAPI = {
  getMe: () => api.get('/stores/me'),
  update: (data: any) => api.put('/stores/me', data),
  getPublic: (slug: string) => api.get(`/stores/public/${slug}`),
  uploadLogo: (logoBase64: string) => api.put('/stores/me', { logo: logoBase64 }),
};

// ─── PRODUCTS ────────────────────────────────────────────────
export const productAPI = {
  list: (params?: any) => api.get('/products', { params }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data: any) => api.post('/products/categories', data),
  getPublic: (storeId: string) => api.get(`/products/public/${storeId}`),
};

// ─── CUSTOMERS ───────────────────────────────────────────────
export const customerAPI = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  findOrCreate: (data: any) => api.post('/customers/find-or-create', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
};

// ─── ORDERS (authenticated — shopkeeper) ──────────────────────
export const orderAPI = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  updateItems: (id: string, data: any) => api.put(`/orders/${id}/items`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
  parseList: (data: any) => api.post('/orders/parse-list', data),
};

// ─── PUBLIC ORDERS (customer QR — no auth) ────────────────────
export const publicOrderAPI = {
  create: (data: {
    storeId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    notes?: string;
    items: { productId?: string; productName: string; quantity: number; unit: string; unitPrice: number }[];
  }) => api.post('/orders/create', data),
  status: (orderNumber: string, params: { storeId: string; phone: string }) =>
    api.get(`/orders/status/${orderNumber}`, { params }),
  parseList: (data: { storeId: string; text: string }) => api.post('/orders/parse-list', data),
};

// ─── INVOICES ────────────────────────────────────────────────
export const invoiceAPI = {
  generate: (orderId: string, data?: any) => api.post(`/invoices/generate/${orderId}`, data),
  get: (id: string) => api.get(`/invoices/${id}`),
  list: () => api.get('/invoices'),
  getPdfUrl: (id: string) => `${API_BASE}/invoices/${id}/pdf`,

  // Fetch PDF with auth token and return blob URL
  fetchPdfBlob: async (id: string): Promise<string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('grocgo_token') : null;
    const res = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/pdf',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // Download PDF as file
  downloadPdf: async (id: string, filename?: string) => {
    const blobUrl = await invoiceAPI.fetchPdfBlob(id);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  },

  // Open PDF in new tab
  openPdf: async (id: string) => {
    const blobUrl = await invoiceAPI.fetchPdfBlob(id);
    window.open(blobUrl, '_blank');
  },
};

// ─── DASHBOARD ───────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  recentOrders: (limit?: number) => api.get('/dashboard/recent-orders', { params: { limit } }),
  topProducts: (limit?: number) => api.get('/dashboard/top-products', { params: { limit } }),
  salesChart: (days?: number) => api.get('/dashboard/sales-chart', { params: { days } }),
  adminStats: () => api.get('/dashboard/admin/stats'),
};

// ─── WHATSAPP ────────────────────────────────────────────────
export const whatsappAPI = {
  sendConfirmation: (orderId: string) => api.post('/whatsapp/send-order-confirmation', { orderId }),
  sendReadyNotification: (orderId: string) => api.post('/whatsapp/send-ready-notification', { orderId }),
  sendReminder: (customerId: string) => api.post('/whatsapp/send-monthly-reminder', { customerId }),
  getLogs: () => api.get('/whatsapp/logs'),
};

// ─── QR CODE ─────────────────────────────────────────────────
export const qrAPI = {
  generate: () => api.post('/qr/generate'),
  getBySlug: (slug: string) => api.get(`/qr/store/${slug}`),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminAPI = {
  stores: (params?: any) => api.get('/admin/stores', { params }),
  toggleStore: (id: string) => api.patch(`/admin/stores/${id}/toggle`),
  updateSubscription: (id: string, data: any) => api.patch(`/admin/stores/${id}/subscription`, data),
  stats: () => api.get('/admin/stats'),
  users: (params?: any) => api.get('/admin/users', { params }),
};

// ─── OCR ─────────────────────────────────────────────────────
export const ocrAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/ocr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
