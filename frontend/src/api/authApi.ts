import api from './axiosInstance';
import type { User } from '../types';

// These functions are the only place in the app that talks
// to the auth endpoints — keeps API calls organized in one place.

// Check if user is currently logged in (reads the httpOnly cookie).
// Called on every app load to restore session.
export async function getMe(): Promise<User> {
  const response = await api.get('/api/auth/me');
  return response.data.user;
}

// Sign up a new customer account.
export async function signup(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<User> {
  const response = await api.post('/api/auth/signup', data);
  return response.data.user;
}

// Log in with email and password.
export async function login(data: {
  email: string;
  password: string;
}): Promise<User> {
  const response = await api.post('/api/auth/login', data);
  return response.data.user;
}

// Log out — clears the httpOnly cookie on the backend.
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}