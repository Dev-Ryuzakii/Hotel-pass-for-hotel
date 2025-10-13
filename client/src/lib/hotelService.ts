import axios from "axios";

const API_URL = "/api/hotel";

export const getProperties = () => axios.get(`${API_URL}/properties`);
export const addProperty = (data: {
  name: string;
  location: string;
  price: number;
  amenities: string[];
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images?: { url: string; publicId?: string; caption?: string }[];
}) => axios.post(`${API_URL}/properties`, data);
export const updateProperty = (propertyId: string, data: Partial<{
  name: string;
  location: string;
  price: number;
  amenities: string[];
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images: { url: string; publicId?: string; caption?: string }[];
  isActive: boolean;
}>) => axios.patch(`${API_URL}/properties/${propertyId}`, data);
export const deleteProperty = (propertyId: string) => axios.delete(`${API_URL}/properties/${propertyId}`);
export const getBookings = () => axios.get(`${API_URL}/bookings`);
export const updateBookingStatus = (data: { bookingId: string; status: string }) =>
  axios.patch(`${API_URL}/bookings/status`, data);
export const requestWithdrawal = (data: { amount: number }) =>
  axios.post(`${API_URL}/withdrawals`, data);
export const uploadPropertyImages = (formData: FormData) =>
  axios.post(`${API_URL}/upload-images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const uploadKycDocument = (formData: FormData) =>
  axios.post(`${API_URL}/upload-kyc`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });