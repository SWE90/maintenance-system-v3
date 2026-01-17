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

  // Tasks endpoints
  async getTasks(params?: Record<string, any>) {
    const { data } = await this.client.get('/tasks', { params });
    return data.data || data;
  }

  async getTask(id: number) {
    const { data } = await this.client.get(`/tasks/${id}`);
    return data.data || data;
  }

  async createTask(taskData: any) {
    const { data } = await this.client.post('/tasks', taskData);
    return data.data || data;
  }

  async updateTask(id: number, taskData: any) {
    const { data } = await this.client.patch(`/tasks/${id}`, taskData);
    return data.data || data;
  }

  async transitionTask(id: number, transition: any) {
    const { data } = await this.client.post(`/tasks/${id}/transition`, transition);
    return data.data || data;
  }

  async assignTechnician(id: number, assignment: any) {
    const { data } = await this.client.post(`/tasks/${id}/assign`, assignment);
    return data.data || data;
  }

  async sendVerificationCode(id: number) {
    const { data } = await this.client.post(`/tasks/${id}/verification-code`);
    return data.data || data;
  }

  async getTaskByTrackingToken(token: string) {
    const { data } = await this.client.get(`/tasks/track/${token}`);
    return data.data || data;
  }

  // Dashboard
  async getDashboardStats() {
    const { data } = await this.client.get('/tasks/stats');
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
}

export const api = new ApiClient();
