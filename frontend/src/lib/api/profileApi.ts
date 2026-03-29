import type { ApiEnvelope } from '@/types';
import { api } from '@/lib/axios';

export type ProfileUpdatePayload = {
  full_name?: string;
  username?: string;
  headline?: string;
  bio?: string;
  experience_level?: 'Entry' | 'Intermediate' | 'Expert';
  skills?: string[];
  education?: Array<{ school: string; degree?: string; year?: string }>;
  certifications?: Array<{ name: string; issuer?: string; year?: string }>;
  portfolio_links?: Array<{ title: string; url: string }>;
  date_of_birth?: string | null;
  phone_number?: string;
  social_links?: {
    linkedin?: string;
    github?: string;
    dribbble?: string;
    instagram?: string;
    facebook?: string;
    other?: string;
  };
  avatar_url?: string;
};

export async function getMyProfile(): Promise<ApiEnvelope<any>> {
  const res = await api.get('/api/profile');
  return res.data;
}

export async function updateMyProfile(payload: ProfileUpdatePayload): Promise<ApiEnvelope<any>> {
  const res = await api.patch('/api/profile', payload);
  return res.data;
}

export async function checkUsername(username: string): Promise<ApiEnvelope<{ available: boolean }>> {
  const res = await api.post('/api/profile/username-check', { username });
  return res.data;
}
