// src/pages/AdminDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import {
  Users,
  Truck,
  ClipboardList,
  Wrench,
  FileWarning,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";

// Sections
import UserSection from "../components/UserSection.js";
import CamionsSection from "../components/CamionsSection.js";
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";

// Carte flotte
import CarteFlotte from "../components/CarteFlotte.js";

// Billing
import BillingExpenses from "./BillingExpenses.js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, camions: 0, missions: 0 });
  const [camions, setCamions] = useState([]);
  const [section, setSection] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  const center = useMemo(() => [12.37, -1.53], []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Récupération stats
      const { data: users } = await supabase.from("users").select("*");
      const { data: camionsData } = await supabase.from("camions").select("*");
      const { data: missions } = await supabase.from("missions").select("*");

      setStats({
        users: users?.length || 0,
        camions: camionsData?.length || 0,
        missions: missions?.length || 0,
      });
      setCamions(camionsData || []);
      setLoading(false);
    };
    fetchData();

    // Realtime
    const channel = supabase
      .channel("camions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "camions" },
        (payload) => {
          setCamions((prev) => {
            const idx = prev.findIndex((c) => c.id === payload.new.id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = payload.new;
              return updated;
            } else {
              return [payload.new, ...prev];
            }
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
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

  const menuItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Utilisateurs" },
    { key: "camions", label: "Véhicules" },
    { key: "missions", label: "Missions" },
    { key: "pannes", label: "Alertes Pannes" },
    { key: "documents", label: "Alertes Documents" },
    { key: "billing", label: "Facturation & Dépenses" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
          <h2 className="text-2xl font-bold">Admin</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMenuOpen(false)} />
          <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-xl z-50 relative">
            <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-white">
              <X size={24} />
            </button>
            <div className="flex flex-col items-center mb-8">
              <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-2xl font-bold">Admin</h2>
            </div>
            <nav className="flex-1 flex flex-col gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setSection(item.key);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                    section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden text-blue-900">
              <Menu size={28} />
            </button>
            <h1 className="text-xl font-bold text-green-700"></h1>
          </div>

          {/* Profil admin */}
          <div className="relative">
            <button
              onClick={() => setProfileMenu(!profileMenu)}
              className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
            >
              <User className="text-blue-900 w-6 h-6" />
              <span className="hidden sm:inline font-medium text-blue-900">{user?.email}</span>
            </button>

            {profileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm text-gray-700 font-medium">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          {section === "dashboard" && (
            <>
              {/* Carte interactive flotte */}
              <div className="h-80 sm:h-96 w-full rounded-xl shadow overflow-hidden mb-6 relative z-0">
                <CarteFlotte camions={camions} />
              </div>

              {/* Stat cards cliquables */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div
                  onClick={() => setSection("users")}
                  className="bg-blue-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <Users className="text-blue-600 w-16 h-16 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-blue-800">Utilisateurs</h3>
                  <p className="text-blue-700 text-xl">{stats.users}</p>
                </div>

                <div
                  onClick={() => setSection("camions")}
                  className="bg-green-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <Truck className="text-green-600 w-16 h-16 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-green-800">Véhicules</h3>
                  <p className="text-green-700 text-xl">{stats.camions}</p>
                </div>

                <div
                  onClick={() => setSection("missions")}
                  className="bg-orange-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <ClipboardList className="text-orange-600 w-16 h-16 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-orange-800">Missions</h3>
                  <p className="text-orange-700 text-xl">{stats.missions}</p>
                </div>

                <div
                  onClick={() => setSection("pannes")}
                  className="bg-red-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <Wrench className="text-red-600 w-16 h-16 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-red-800">Alertes Pannes</h3>
                </div>

                <div
                  onClick={() => setSection("documents")}
                  className="bg-purple-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <FileWarning className="text-purple-600 w-16 h-16 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-purple-800">Alertes Documents</h3>
                </div>
              </div>
            </>
          )}

          {section === "users" && <UserSection />}
          {section === "camions" && <CamionsSection />}
          {section === "missions" && <MissionsSection />}
          {section === "pannes" && <PannesDeclarees />}
          {section === "documents" && <AlertesExpiration />}
          {section === "billing" && <BillingExpenses />}
        </div>
      </div>
    </div>
  );
}
