import axios from "axios";

const API_URL = "/api/auth";

export const register = (data: { username: string; email: string; password: string; role?: string; picture?: string }) =>
  axios.post(`${API_URL}/register`, data);

export const login = (data: { email: string; password: string }) =>
  axios.post(`${API_URL}/login`, data);

export const initiateKYC = (data: { userId: string; documentType: string; documentUrl: string }) =>
  axios.post(`${API_URL}/initiate-kyc`, data);

export const verifyKYC = (data: { userId: string; status: string; rejectionReason?: string }) =>
  axios.post(`${API_URL}/kyc/verify`, data);

export const registerHotel = (data: { adminId: string; hotelName: string; location: string; description: string }) =>
  axios.post(`${API_URL}/register-hotel`, data);