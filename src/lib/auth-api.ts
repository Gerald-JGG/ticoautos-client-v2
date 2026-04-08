import api from '@/lib/api';
import { AuthResponse } from '@/types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    cedula: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
};