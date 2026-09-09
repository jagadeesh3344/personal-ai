import { apiClient } from './client';

export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string };
  session?: { access_token: string };
  error?: string;
}

export const authApi = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/signup', { email, password });
    if (res.session?.access_token) {
      apiClient.setToken(res.session.access_token);
    }
    return res;
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/signin', { email, password });
    if (res.session?.access_token) {
      apiClient.setToken(res.session.access_token);
    }
    return res;
  },

  async signOut(): Promise<void> {
    try {
      await apiClient.post('/auth/signout');
    } finally {
      apiClient.setToken(null);
    }
  },

  async getSession(): Promise<{ success: boolean; user?: { id: string; email: string } }> {
    return apiClient.get('/auth/session');
  }
};
