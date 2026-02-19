import {apiRequest} from './api';

interface AuthPayload {
  token: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

interface MePayload {
  id: string;
  email: string;
  authProvider: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  activeGoal: {
    goalType: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
  } | null;
}

export const loginByPassword = async (email: string, password: string): Promise<AuthPayload> =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: {email, password},
  });

export const registerByPassword = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthPayload> =>
  apiRequest('/auth/register', {
    method: 'POST',
    body: {email, password, displayName},
  });

export const fetchMe = async (token: string): Promise<MePayload> =>
  apiRequest('/me', {
    method: 'GET',
    token,
  });
