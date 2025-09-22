// src/components/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";

export default function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erreur auth:", error);
        setLoading(false);
        return;
      }
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erreur profil:", profileError);
        setLoading(false);
        return;
      }

      if (profile?.role === requiredRole) {
        setUser(user);
      }

      setLoading(false);
    };

    checkUser();
  }, [requiredRole]);

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
