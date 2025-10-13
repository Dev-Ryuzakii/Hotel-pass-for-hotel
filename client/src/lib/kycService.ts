import axios from "axios";

export const initiateKYC = (data: { userId: string; documentType: string; documentUrl: string }) =>
  axios.post("/api/auth/initiate-kyc", data);

export const verifyKYC = (data: { userId: string; status: string; rejectionReason?: string }) =>
  axios.post("/api/auth/kyc/verify", data);