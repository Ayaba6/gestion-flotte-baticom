// src/components/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";

export default function ProtectedRoute({ children, requiredRole }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Récupérer l'utilisateur connecté
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

        // Récupérer le rôle depuis la table users
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Erreur récupération rôle:", profileError);
          setLoading(false);
          return;
        }

        setUserRole(profile?.role || null);
      } catch (err) {
        console.error("Erreur ProtectedRoute:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Affichage pendant le chargement
  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  // Non connecté → login
  if (!userRole) return <Navigate to="/login" replace />;

  // Rôle non autorisé → login
  if (requiredRole && userRole !== requiredRole) return <Navigate to="/login" replace />;

  // Accès autorisé
  return children;
}
