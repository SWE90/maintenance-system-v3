import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.accessToken);
              localStorage.setItem('refreshToken', response.refreshToken);

              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async staffLogin(email: string, password: string) {
    const { data } = await this.client.post('/auth/staff/login', { email, password });
    return data.data || data;
  }

  async requestOtp(phone: string) {
    const { data } = await this.client.post('/auth/customer/otp/request', { phone });
    return data.data || data;
  }

  async verifyOtp(phone: string, code: string) {
    const { data } = await this.client.post('/auth/customer/otp/verify', { phone, code });
    return data.data || data;
  }

  async refreshToken(refreshToken: string) {
    const { data } = await this.client.post('/auth/refresh', { refreshToken });
    return data.data || data;
  }

  async logout(refreshToken: string) {
    const { data } = await this.client.post('/auth/logout', { refreshToken });
    return data.data || data;
  }

  async getProfile() {
    const { data } = await this.client.get('/auth/me');
    return data.data || data;
  }

  // Tickets endpoints (updated from tasks to tickets)
  async getTasks(params?: Record<string, any>) {
    const { data } = await this.client.get('/tickets', { params });
    return data.data || data;
  }

  async getTask(id: number) {
    const { data } = await this.client.get(`/tickets/${id}`);
    return data.data || data;
  }

  async createTask(taskData: any) {
    const { data } = await this.client.post('/tickets', taskData);
    return data.data || data;
  }

  async updateTask(id: number, taskData: any) {
    const { data } = await this.client.patch(`/tickets/${id}`, taskData);
    return data.data || data;
  }

  async transitionTask(id: number, transition: any) {
    const { data } = await this.client.post(`/tickets/${id}/transition`, transition);
    return data.data || data;
  }

  async assignTechnician(id: number, assignment: any) {
    const { data } = await this.client.post(`/tickets/${id}/assign`, assignment);
    return data.data || data;
  }

  async sendVerificationCode(id: number) {
    const { data } = await this.client.post(`/tickets/${id}/verification-code`);
    return data.data || data;
  }

  async getTaskByTrackingToken(token: string) {
    const { data } = await this.client.get(`/tickets/track/${token}`);
    return data.data || data;
  }

  // Dashboard
  async getDashboardStats() {
    const { data } = await this.client.get('/tickets/stats');
    return data.data || data;
  }

  // Users
  async getUsers(params?: Record<string, any>) {
    const { data } = await this.client.get('/users', { params });
    return data.data || data;
  }

  async getTechnicians() {
    const { data } = await this.client.get('/users', { params: { role: 'technician' } });
    return data.data || data;
  }

  // Tracking
  async updateLocation(location: { lat: number; lng: number; taskId?: number }) {
    const { data } = await this.client.post('/tracking/location', location);
    return data.data || data;
  }

  async getTechnicianLocations() {
    const { data } = await this.client.get('/tracking/technicians');
    return data.data || data;
  }

  // Spare Parts endpoints
  async getSpareParts(params?: Record<string, any>) {
    const { data } = await this.client.get('/spare-parts', { params });
    return data.data || data;
  }

  async getSparePart(id: number) {
    const { data } = await this.client.get(`/spare-parts/${id}`);
    return data.data || data;
  }

  async createSparePart(sparePartData: any) {
    const { data } = await this.client.post('/spare-parts', sparePartData);
    return data.data || data;
  }

  async updateSparePart(id: number, sparePartData: any) {
    const { data } = await this.client.patch(`/spare-parts/${id}`, sparePartData);
    return data.data || data;
  }

  async updateSparePartStock(id: number, quantity: number, operation: 'add' | 'subtract') {
    const { data } = await this.client.post(`/spare-parts/${id}/stock`, { quantity, operation });
    return data.data || data;
  }

  async getLowStockItems() {
    const { data } = await this.client.get('/spare-parts/low-stock');
    return data.data || data;
  }

  async getInventoryValue() {
    const { data } = await this.client.get('/spare-parts/inventory-value');
    return data.data || data;
  }

  // Workshops endpoints
  async getWorkshops(params?: Record<string, any>) {
    const { data } = await this.client.get('/workshops', { params });
    return data.data || data;
  }

  async getWorkshop(id: number) {
    const { data } = await this.client.get(`/workshops/${id}`);
    return data.data || data;
  }

  async createWorkshop(workshopData: any) {
    const { data } = await this.client.post('/workshops', workshopData);
    return data.data || data;
  }

  async updateWorkshop(id: number, workshopData: any) {
    const { data } = await this.client.patch(`/workshops/${id}`, workshopData);
    return data.data || data;
  }

  async createWorkshopJob(jobData: any) {
    const { data } = await this.client.post('/workshops/jobs', jobData);
    return data.data || data;
  }

  async updateWorkshopJob(id: number, jobData: any) {
    const { data } = await this.client.patch(`/workshops/jobs/${id}`, jobData);
    return data.data || data;
  }

  async getWorkshopJobs(ticketId: number) {
    const { data } = await this.client.get(`/workshops/jobs/ticket/${ticketId}`);
    return data.data || data;
  }

  async getWorkshopStats(workshopId: number) {
    const { data } = await this.client.get(`/workshops/${workshopId}/stats`);
    return data.data || data;
  }

  // KPI endpoints
  async getKpiSnapshots(params?: Record<string, any>) {
    const { data } = await this.client.get('/kpi/snapshots', { params });
    return data.data || data;
  }

  async generateKpiSnapshot(type: 'daily' | 'weekly' | 'monthly') {
    const { data } = await this.client.post('/kpi/generate', { type });
    return data.data || data;
  }

  // Categories endpoints
  async getCategories() {
    const { data } = await this.client.get('/categories');
    return data.data || data;
  }

  // Suppliers endpoints
  async getSuppliers(params?: Record<string, any>) {
    const { data } = await this.client.get('/suppliers', { params });
    return data.data || data;
  }
}

export const api = new ApiClient();
