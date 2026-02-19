import {apiRequest} from './api';

export type GoalType = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface MeProfile {
  id: string;
  email: string;
  authProvider: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  activeGoal: {
    goalType: GoalType;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
  } | null;
}

export interface MySettings {
  userId: string;
  defaultRestSec: number;
  stepSec: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  updatedAt: string;
}

export interface MyGoalPayload {
  goal: {
    id: string;
    goalType: GoalType;
    isActive: boolean;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
  } | null;
}

export interface UpdateSettingsInput {
  defaultRestSec?: number;
  stepSec?: number;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

export const fetchMyProfile = async (token: string): Promise<MeProfile> =>
  apiRequest('/me', {
    method: 'GET',
    token,
  });

export const fetchMySettings = async (token: string): Promise<MySettings> =>
  apiRequest('/me/settings', {
    method: 'GET',
    token,
  });

export const updateMySettings = async (
  token: string,
  payload: UpdateSettingsInput,
): Promise<MySettings> =>
  apiRequest('/me/settings', {
    method: 'PUT',
    token,
    body: payload,
  });

export const fetchMyGoal = async (token: string): Promise<MyGoalPayload> =>
  apiRequest('/me/goal', {
    method: 'GET',
    token,
  });

export const updateMyGoal = async (
  token: string,
  payload: {goalType: GoalType},
): Promise<MyGoalPayload> =>
  apiRequest('/me/goal', {
    method: 'PUT',
    token,
    body: payload,
  });
