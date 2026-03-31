import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "observer" | "casual_buyer" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isCasualBuyer: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  username: string | null;
  fullName: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  isCasualBuyer: false,
  isAdmin: false,
  canEdit: false,
  username: null,
  fullName: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    setRole((data?.role as AppRole) ?? null);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    setFullName(data?.full_name ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchRole(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setFullName(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const username = user?.user_metadata?.username ?? null;
  const isAdmin = role === "admin";
  const isCasualBuyer = role === "casual_buyer";
  const canEdit = isAdmin || isCasualBuyer;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        isCasualBuyer,
        isAdmin,
        canEdit,
        username,
        fullName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
