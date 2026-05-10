"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function stringifyErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => stringifyErrorDetail(item))
      .filter(Boolean)
      .join("; ");
  }
  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;
    const nestedMessage = record.message ?? record.msg ?? record.detail;
    if (nestedMessage) return stringifyErrorDetail(nestedMessage);

    const field = Array.isArray(record.loc) ? record.loc.join(".") : record.loc;
    const type = typeof record.type === "string" ? ` (${record.type})` : "";
    if (field) return `${field}: ${JSON.stringify(record)}${type}`;

    try {
      return JSON.stringify(detail);
    } catch {
      return "Unexpected error";
    }
  }
  return "";
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const err = await res.json();
    return stringifyErrorDetail(err.detail ?? err.message ?? err) || fallback;
  } catch {
    return fallback;
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: string;       // "admin" | "user"
  credits: number;
  auth_provider: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchMe = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setToken(authToken);
      } else {
        // Invalid token
        localStorage.removeItem("td_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      // Network error — keep token but clear user
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load saved session on mount
  useEffect(() => {
    async function initializeSession() {
      const savedToken = localStorage.getItem("td_token");
      if (savedToken) {
        await fetchMe(savedToken);
      } else {
        setIsLoading(false);
      }
    }

    void initializeSession();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Login failed"));
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("td_token", data.token);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Registration failed"));
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("td_token", data.token);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      throw new Error(await getErrorMessage(res, "Google login failed"));
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("td_token", data.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("td_token");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAdmin, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
