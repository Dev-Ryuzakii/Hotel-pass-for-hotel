import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "./axiosConfig";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const endpoint = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const token = localStorage.getItem("token");
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData && data !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method,
    headers,
    body: isFormData ? (data as FormData) : data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Utility functions for the specified endpoints
export const authApi = {
  register: (data: { 
    username: string; 
    email: string; 
    password: string; 
    hotelName: string;
    location: string;
    description: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
  }) =>
    apiRequest("POST", "/api/hotel/auth/register", data),
  login: (data: { email: string; password: string }) =>
    apiRequest("POST", "/api/hotel/auth/login", data),
};

export const hotelApi = {
  getHotel: () => apiRequest("GET", "/api/hotel"),
  getProperties: () => apiRequest("GET", "/api/hotel/properties"),
  addProperty: (data: {
    name: string;
    location: string;
    price: number;
    amenities: string[];
    description: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    images?: { url: string; publicId?: string; caption?: string }[];
  }) => apiRequest("POST", "/api/hotel/properties", data),
  getBookings: () => apiRequest("GET", "/api/hotel/bookings"),
  updateBookingStatus: (data: { bookingId: string; status: string }) =>
    apiRequest("PATCH", "/api/hotel/bookings/status", data),
  requestWithdrawal: (data: { amount: number }) =>
    apiRequest("POST", "/api/hotel/withdrawals", data),
  uploadPropertyImages: (formData: FormData) =>
    apiRequest("POST", "/api/hotel/upload-images", formData),
  uploadKycDocument: (formData: FormData) =>
    apiRequest("POST", "/api/hotel/upload-kyc", formData),
};

export const kycApi = {
  initiateKYC: (data: { userId: string; documentType: string; documentUrl: string }) =>
    apiRequest("POST", "/api/auth/initiate-kyc", data),
  verifyKYC: (data: { userId: string; status: string; rejectionReason?: string }) =>
    apiRequest("POST", "/api/auth/kyc/verify", data),
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});