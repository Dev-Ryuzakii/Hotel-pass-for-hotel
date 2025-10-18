import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Hotel } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, authApi } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { create } from "zustand";
import { useLocation } from "wouter";

type AuthContextType = {
  hotel: Hotel | null;
  user: Hotel | null;
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  logout: () => void;
};

const useLoginMutation = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await authApi.login(credentials);
      return res.json();
    },
    onSuccess: (data: { token?: string; user?: Hotel; message?: string }) => {
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        queryClient.setQueryData(["/api/hotel"], data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      toast({ title: "Login successful" });
      // Redirect to dashboard after successful login
      setLocation("/dashboard");
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
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      const res = await authApi.register(data);
      return res.json();
    },
    onSuccess: (data: { token?: string; user?: Hotel; message?: string }) => {
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        queryClient.setQueryData(["/api/hotel"], data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      toast({ title: "Registration successful" });
      // Redirect to dashboard after successful registration
      setLocation("/dashboard");
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
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["/api/hotel"] });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast({ title: "Logged out successfully" });
      // Redirect to auth page after successful logout
      setLocation("/auth");
    },
    onError: (error: Error) => {
      // Even if API call fails, still clear local data and redirect
      queryClient.removeQueries({ queryKey: ["/api/hotel"] });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast({ 
        title: "Logged out", 
        description: "Session ended" 
      });
      // Redirect to auth page
      setLocation("/auth");
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
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return (
    <AuthContext.Provider
      value={{
        hotel: hotel ?? null,
        user: hotel ?? null,
        token,
        isLoading,
        error: error ?? null,
        loginMutation,
        registerMutation,
        logoutMutation,
        logout: () => logoutMutation.mutate(),
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
      const response = await authApi.login({ email, password });
      const data = await response.json();
      if (!data?.token) {
        throw new Error("Authentication token missing from response");
      }

      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      set({
        isAuthenticated: true,
        user: data.user ?? null,
        token: data.token,
      });
    } catch (error) {
      throw error;
    }
  },
  logout: async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ isAuthenticated: false, user: null, token: null });
      window.location.href = "/auth";
    } catch (error) {
      // Even if API call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ isAuthenticated: false, user: null, token: null });
      window.location.href = "/auth";
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
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? (JSON.parse(storedUser) as Hotel) : null;

      set({ isAuthenticated: true, user, token });
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