// src/pages/SuperviseurDashboard.js
import React, { useEffect, useState } from "react";
import LayoutGlobal from "../components/LayoutGlobal.js";
import { supabase } from "../services/supabaseClient.js";

export default function SuperviseurDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;
      setUser(user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) return <p className="text-center mt-10 text-gray-500">Chargement...</p>;

  return (
    <LayoutGlobal userRole="superviseur" userEmail={user.email}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold mb-2">Missions</h2>
          <p className="text-gray-500">Suivi et gestion des missions des chauffeurs.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">Rapports</h2>
          <p className="text-gray-500">Génération de rapports et statistiques.</p>
        </div>
      </div>
    </LayoutGlobal>
  );
}
