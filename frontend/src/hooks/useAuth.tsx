"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiClient } from "@/integrations/api/client";

type User = { id: string; email?: string; role?: string; user_metadata?: Record<string, unknown> };
type Session = { access_token: string; user: User };
type AuthError = { message: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const authCheckId = useRef(0);

  const checkAdmin = useCallback(async (nextUser: User) => nextUser.role === "admin", []);

  const applySession = useCallback(async (nextSession: Session | null) => {
    const checkId = authCheckId.current + 1;
    authCheckId.current = checkId;
    const validSession = nextSession?.access_token && nextSession.user ? nextSession : null;

    setLoading(true);
    setSession(validSession);
    setUser(validSession?.user ?? null);

    if (!validSession) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const hasAdminRole = await checkAdmin(validSession.user);

      if (authCheckId.current === checkId) {
        setIsAdmin(hasAdminRole);
      }
    } catch (error) {
      if (authCheckId.current === checkId) {
        console.error("Unable to verify admin role:", error);
        setIsAdmin(false);
      }
    } finally {
      if (authCheckId.current === checkId) {
        setLoading(false);
      }
    }
  }, [checkAdmin]);

  useEffect(() => {
    const { data: { subscription } } = apiClient.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => {
          void applySession(session);
        }, 0);
      }
    );

    apiClient.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Unable to restore auth session:", error.message);
        }

        void applySession(session);
      })
      .catch((error) => {
        console.error("Unable to restore auth session:", error);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      });

    return () => {
      authCheckId.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await apiClient.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await apiClient.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
