// src/pages/AdminDashboard.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  LayoutDashboard,
  DollarSign,
  Send, // Ajouté pour la cohérence si vous l'utilisez dans les StatCards
} from "lucide-react";

// Importations des sections (inchangées)
import UserSection from "../components/UserSection.js";
import CamionsSection from "../components/CamionsSection.js";
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";
import CarteFlotte from "../components/CarteFlotte.js";
import BillingExpenses from "./BillingExpenses.js";

// Configuration des éléments du menu (Exclut Dashboard ici pour le placer en dur)
const menuItemsConfig = [
  { key: "users", label: "Utilisateurs", icon: Users },
  { key: "camions", label: "Véhicules", icon: Truck },
  { key: "missions", label: "Missions", icon: ClipboardList },
  { key: "pannes", label: "Alertes Pannes", icon: Wrench },
  { key: "documents", label: "Alertes Documents", icon: FileWarning },
  { key: "billing", label: "Facturation & Dépenses", icon: DollarSign },
];

// Composant de StatCard réutilisable (inchangé)
const StatCard = ({ title, value, icon: Icon, colorClass, onClick }) => (
  <button
    onClick={onClick}
    className={`bg-${colorClass}-50 p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer w-full text-center`}
  >
    <Icon className={`text-${colorClass}-600 w-12 h-12 mb-3`} />
    <h3 className={`font-bold text-lg mb-1 text-${colorClass}-800`}>{title}</h3>
    {value !== undefined && <p className={`text-${colorClass}-700 text-2xl font-extrabold`}>{value}</p>}
  </button>
);


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

  // Fusionne le dashboard pour la recherche, mais le garde séparé dans le JSX
  const allMenuItems = useMemo(() => 
    [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }, ...menuItemsConfig]
  , []);
  
  const currentSectionLabel = useMemo(() => {
    const item = allMenuItems.find(item => item.key === section);
    return item ? item.label : "Tableau de Bord Administrateur";
  }, [section, allMenuItems]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Authentification et récupération de données... (inchangée)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);

      const [
        { data: usersData },
        { data: camionsData },
        { data: missionsData },
      ] = await Promise.all([
        supabase.from("users").select("id"),
        supabase.from("camions").select("*"),
        supabase.from("missions").select("id"),
      ]);

      setStats({
        users: usersData?.length || 0,
        camions: camionsData?.length || 0,
        missions: missionsData?.length || 0,
      });
      setCamions(camionsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des données initiales:", error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();

    // Realtime (inchangé)
    const channel = supabase
      .channel("camions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "camions" },
        // ... (logique realtime inchangée)
        (payload) => {
          setCamions((prev) => {
            const payloadNew = payload.new || payload.old;
            if (!payloadNew) return prev;

            const idx = prev.findIndex((c) => c.id === payloadNew.id);
            if (payload.eventType === 'DELETE') {
                 return prev.filter(c => c.id !== payloadNew.id);
            } else if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = payload.new;
              return updated;
            } else if (payload.eventType === 'INSERT') {
              return [payload.new, ...prev];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel)
    };
  }, [fetchData]);

  // Loader (inchangé)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
             <p className="text-gray-500 mt-4 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Fonction de rendu des sections (inchangée)
  const renderSection = () => {
    switch (section) {
      case "users": return <UserSection />;
      case "camions": return <CamionsSection />;
      case "missions": return <MissionsSection />;
      case "pannes": return <PannesDeclarees />;
      case "documents": return <AlertesExpiration />;
      case "billing": return <BillingExpenses />;
      case "dashboard":
      default:
        return (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Localisation de la Flotte</h2>
            {/* Carte interactive flotte */}
            <div className="h-80 sm:h-96 w-full rounded-xl shadow-xl overflow-hidden mb-8 relative z-0 border border-gray-200">
              <CarteFlotte camions={camions} center={center} />
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 mt-4">Statistiques Clés</h2>
            {/* Stat cards cliquables */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Utilisateurs"
                value={stats.users}
                icon={Users}
                colorClass="blue"
                onClick={() => setSection("users")}
              />
              <StatCard
                title="Véhicules"
                value={stats.camions}
                icon={Truck}
                colorClass="green"
                onClick={() => setSection("camions")}
              />
              <StatCard
                title="Missions"
                value={stats.missions}
                icon={ClipboardList}
                colorClass="orange"
                onClick={() => setSection("missions")}
              />
              <StatCard
                title="Alertes Pannes"
                icon={Wrench}
                colorClass="red"
                onClick={() => setSection("pannes")}
              />
              <StatCard
                title="Alertes Documents"
                icon={FileWarning}
                colorClass="purple"
                onClick={() => setSection("documents")}
              />
            </div>
          </>
        );
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 1. Sidebar desktop */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl sticky top-0 h-screen">
        <div className="flex flex-col items-center mb-6 mt-4"> {/* Marge réduite ici */}
          <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-3" /> {/* Taille réduite */}
          <h2 className="text-xl font-extrabold text-blue-200 tracking-wider">ADMIN PANEL</h2> {/* Titre ajouté pour la marque */}
        </div>
        
        {/* NOUVEAU: Dashboard bouton séparé et mis en avant */}
        <button
          onClick={() => setSection("dashboard")}
          className={`flex items-center gap-4 px-4 py-3 mb-4 rounded-xl font-extrabold text-lg transition duration-200 text-left w-full ${
            section === "dashboard" ? "bg-blue-700 shadow-lg text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
          }`}
        >
          <LayoutDashboard size={22} />
          Dashboard
        </button>
        
        {/* Lignes de navigation restantes */}
        <nav className="flex-1 flex flex-col gap-2 border-t border-blue-700 pt-4"> {/* Ligne de séparation ajoutée */}
          {menuItemsConfig.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition duration-200 text-left ${
                section === item.key ? "bg-blue-700 shadow-md text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. Sidebar mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setMenuOpen(false)} />
          <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-2xl z-50 relative">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-blue-800 rounded-full transition"
              aria-label="Fermer le menu"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center my-6"> {/* Marge ajustée ici aussi */}
              <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-xl font-bold">Admin Panel</h2>
            </div>
            
            <nav className="flex-1 flex flex-col gap-2">
                 {/* Tous les boutons de menu sont listés ici pour le mobile */}
                {allMenuItems.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => {
                            setSection(item.key);
                            setMenuOpen(false); 
                        }}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition duration-200 text-left ${
                            section === item.key ? "bg-blue-700 shadow-md text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
                        }`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </button>
                ))}
            </nav>
          </aside>
        </div>
      )}

      {/* 3. Main content (inchangé) */}
      <div className="flex-1 flex flex-col">
        {/* HEADER (inchangé) */}
        <header className="bg-white sticky top-0 z-40 shadow-md px-4 sm:px-8 py-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-blue-900 p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Ouvrir le menu"
            >
              <Menu size={28} />
            </button>
            {/* Affichage dynamique du titre de la section */}
            <h1 className="text-2xl font-extrabold text-blue-900">{currentSectionLabel}</h1>
          </div>

          {/* Profil admin (inchangé) */}
          <div className="relative">
            <button
              onClick={() => setProfileMenu((prev) => !prev)}
              className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={profileMenu}
            >
              <User className="text-blue-700 w-5 h-5" />
              <span className="hidden sm:inline font-semibold text-blue-900">{user?.email}</span>
            </button>

            {profileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden z-50 animate-fadeInUp">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <p className="text-sm font-medium text-gray-500">Connecté en tant que:</p>
                  <p className="text-base text-gray-900 font-bold truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition text-left"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 4. Contenu principal dynamique (inchangé) */}
        <main className="flex-1 flex flex-col p-4 sm:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}