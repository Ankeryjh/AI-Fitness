import {Platform} from 'react-native';

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error?: {
    message?: string;
    details?: unknown;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

// Android emulator cannot access host loopback via 127.0.0.1, so dev uses 10.0.2.2.
const DEV_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

const PROD_API_BASE_URL = 'http://127.0.0.1:3001';

export const API_BASE_URL = __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL;

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const isApiFailure = <T>(payload: ApiSuccess<T> | ApiFailure | null): payload is ApiFailure => {
  return Boolean(payload && payload.ok === false);
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {method = 'GET', body, token} = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: ApiSuccess<T> | ApiFailure | null = null;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = null;
  }

  if (response.ok && payload?.ok) {
    return payload.data;
  }

  const message = isApiFailure(payload)
    ? payload.error?.message || `Request failed with status ${response.status}`
    : `Request failed with status ${response.status}`;
  const details = isApiFailure(payload) ? payload.error?.details : undefined;
  throw new ApiError(message, response.status, details);
};
