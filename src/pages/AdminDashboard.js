// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import { Users, Truck, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, vehicles: 0, missions: 0 });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Fetch stats exemples (à adapter selon vos tables)
      const { data: users } = await supabase.from("users").select("*");
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      const { data: missions } = await supabase.from("missions").select("*");

      setStats({
        users: users?.length || 0,
        vehicles: vehicles?.length || 0,
        missions: missions?.length || 0,
      });

      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logoSociete} alt="Logo" className="w-12 h-12 object-contain" />
          <h1 className="text-xl font-bold text-green-700">BATICOM - Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="bg-blue-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1">
          <Users className="text-blue-600 w-16 h-16 mb-4" />
          <h3 className="font-bold text-lg mb-2 text-blue-800">Utilisateurs</h3>
          <p className="text-blue-700 text-xl">{stats.users}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1">
          <Truck className="text-green-600 w-16 h-16 mb-4" />
          <h3 className="font-bold text-lg mb-2 text-green-800">Véhicules</h3>
          <p className="text-green-700 text-xl">{stats.vehicles}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1">
          <ClipboardList className="text-orange-600 w-16 h-16 mb-4" />
          <h3 className="font-bold text-lg mb-2 text-orange-800">Missions</h3>
          <p className="text-orange-700 text-xl">{stats.missions}</p>
        </div>
      </div>

      {/* MAIN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div
          onClick={() => navigate("/admin-users")}
          className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:shadow-2xl transition transform hover:-translate-y-1 text-center"
        >
          <Users className="text-blue-600 w-20 h-20 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Gestion des Utilisateurs</h3>
          <p className="text-gray-600">Créez et gérez superviseurs et chauffeurs</p>
        </div>

        <div
          onClick={() => navigate("/admin-flotte")}
          className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:shadow-2xl transition transform hover:-translate-y-1 text-center"
        >
          <Truck className="text-green-600 w-20 h-20 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Gestion de la Flotte</h3>
          <p className="text-gray-600">Suivi et gestion des véhicules et missions</p>
        </div>
      </div>
    </div>
  );
}
