import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { AuthContext } from "./authContext";

// Definimos cómo se ve nuestro perfil basado en la BD
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Función para ir a buscar el rol a la tabla profiles
const fetchProfile = async (
  userId: string,
  setProfile: (profile: Profile | null) => void,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) console.error("Error fetching profile:", error);
  else setProfile(data);
};

// El Proveedor que envolverá nuestra app en main.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user.id, setProfile);
      else setLoading(false);
    });

    // 2. Escuchar cambios en la autenticación (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para cerrar sesión
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // El value es lo que los componentes podrán usar
  const value = { user, profile, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
