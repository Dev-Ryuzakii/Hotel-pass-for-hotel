import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Hotel } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { create } from "zustand";

type AuthContextType = {
  hotel: Hotel | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

const useLoginMutation = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (hotel: Hotel) => {
      queryClient.setQueryData(["/api/hotel"], hotel);
      toast({ title: "Login successful" });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

const useRegisterMutation = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      address: string;
      city: string;
      phone: string;
    }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: (hotel: Hotel) => {
      queryClient.setQueryData(["/api/hotel"], hotel);
      toast({ title: "Registration successful" });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

const useLogoutMutation = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/hotel"], null);
      toast({ title: "Logged out successfully" });
    },
  });
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: hotel,
    error,
    isLoading,
  } = useQuery<Hotel | null>({
    queryKey: ["/api/hotel"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        hotel: hotel ?? null,
        isLoading,
        error: error ?? null,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

interface AuthState {
  isAuthenticated: boolean;
  user: Hotel | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem("token"),
  login: async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/login", {
        email,
        password,
      });
      const { token, user } = response;
      localStorage.setItem("token", token);
      set({ isAuthenticated: true, user, token });
    } catch (error) {
      throw error;
    }
  },
  logout: async () => {
    try {
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem("token");
      set({ isAuthenticated: false, user: null, token: null });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
  checkAuth: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ isAuthenticated: false, user: null, token: null });
        return;
      }

      const response = await apiRequest("GET", "/api/hotel");
      set({ isAuthenticated: true, user: response, token });
    } catch (error) {
      localStorage.removeItem("token");
      set({ isAuthenticated: false, user: null, token: null });
    }
  },
}));

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
