// src/pages/ChauffeurDashboard.js - Version Pro "Waouh"

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import {
  Menu,
  X,
  User,
  LogOut,
  Truck,
  LayoutDashboard,
  AlertTriangle,
  Loader2,
  CalendarCheck,
  Hourglass,
  Archive,
} from "lucide-react";
import ModalMission from "../components/ModalMission.js";

// --- Constantes ---
const MENU_ITEMS = [
  { label: "Tableau de bord", icon: LayoutDashboard, path: "/chauffeur" },
  { label: "Missions", icon: Truck, path: "/missionshistorique" },
  { label: "Pannes", icon: AlertTriangle, path: "/panneshistorique" },
];

// --- Sidebar Desktop ---
const DesktopSidebar = ({ navigate }) => (
  <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-5 shadow-2xl sticky top-0 h-screen">
    <div className="flex flex-col items-center mb-10 mt-4">
      <img src={logoSociete} alt="Logo BATICOM" className="w-16 h-16 object-cover mb-3 rounded-xl bg-white p-1" />
      <h2 className="text-2xl font-extrabold text-blue-200 tracking-widest uppercase">BATICOM</h2>
    </div>
    <nav className="flex flex-col gap-1 mt-6">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          className="flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-left text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-300 border-l-4 border-transparent hover:border-blue-300"
        >
          <item.icon size={22} /> <span className="text-base">{item.label}</span>
        </button>
      ))}
    </nav>
  </aside>
);

// --- Sidebar Mobile ---
const MobileSidebar = ({ menuOpen, setMenuOpen, navigate }) => (
  <div
    className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
  >
    <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
    <div className="relative bg-blue-900 w-64 h-full p-5 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <img src={logoSociete} alt="Logo BATICOM" className="w-12 h-12 object-cover rounded-xl bg-white p-1" />
        <button onClick={() => setMenuOpen(false)} className="text-white p-2 hover:bg-blue-800 rounded-lg transition">
          <X size={24} />
        </button>
      </div>
      <nav className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => { navigate(item.path); setMenuOpen(false); }}
            className="flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-left text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-300 border-l-4 border-transparent hover:border-blue-300"
          >
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>
    </div>
  </div>
);

// --- Header ---
const DashboardHeader = ({ user, handleLogout, setMenuOpen, profileMenu, setProfileMenu }) => (
  <header className="bg-white sticky top-0 z-40 shadow-lg px-6 sm:px-10 py-4 flex justify-between items-center border-b border-gray-200">
    <div className="flex items-center gap-4">
      <button
        onClick={() => setMenuOpen(true)}
        className="md:hidden text-blue-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={28} />
      </button>
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
    </div>
    <div className="relative">
      <button
        onClick={() => setProfileMenu(prev => !prev)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={profileMenu}
      >
        <User className="text-blue-600 w-6 h-6 bg-blue-50 p-1 rounded-full" />
        <span className="hidden sm:inline font-medium text-gray-700 truncate max-w-[140px]">{user?.email}</span>
      </button>
      {profileMenu && (
        <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden z-50 animate-fadeInUp">
          <div className="px-4 py-3 border-b bg-gray-50/70">
            <p className="text-sm text-gray-500">Connecté:</p>
            <p className="text-base font-semibold text-gray-800 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-left transition-colors font-medium"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  </header>
);

// --- Skeleton Card ---
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse min-h-[320px]">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded"></div>
  </div>
);

// --- Mission Card ---
const MissionCard = ({ title, data, setModalMission, icon: Icon, accentColor }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-lg border-t-8 ${accentColor} transition-transform duration-500 transform hover:scale-105 hover:shadow-2xl`}
    style={{ minHeight: '250px' }}
  >
    <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100">
      <div className="flex items-center gap-3">
        <Icon size={24} className={accentColor.replace('border-t-8 border-', 'text-')} />
        <h2 className="text-xl font-extrabold text-gray-800 uppercase tracking-wide">{title}</h2>
      </div>
      <span className={`px-3 py-1 text-sm font-bold rounded-full ${accentColor.replace('border-t-8 border-', 'bg-')} text-white`}>
        {data.length}
      </span>
    </div>

    {data.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-48 rounded-md p-4 text-center">
        <p className="text-gray-400 italic text-md">Aucune mission trouvée.</p>
      </div>
    ) : (
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {data.map((m) => (
          <button
            key={m.id_uuid}
            className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200"
            onClick={() => setModalMission(m)}
          >
            <h3 className="font-semibold text-gray-800 truncate">{m.titre}</h3>
            <p className="text-gray-500 text-xs truncate mt-0.5">{m.description}</p>
          </button>
        ))}
      </div>
    )}
  </div>
);

// --- Composant Principal ---
export default function ChauffeurDashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState({ user: null, chauffeurId: null, missions: [], loading: true, error: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [modalMission, setModalMission] = useState(null);

  const { user, chauffeurId, missions, loading, error } = state;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) return navigate("/login");
      setState(s => ({ ...s, user: authUser, chauffeurId: authUser.id, loading: false }));
    };
    fetchUser();
  }, [navigate]);

  const fetchMissions = useCallback(async () => {
    if (!chauffeurId) return;
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("chauffeur_id", chauffeurId)
      .order("created_at", { ascending: false });
    if (missionsError) {
      setState(s => ({ ...s, error: "Impossible de charger les missions.", loading: false }));
      return;
    }
    setState(s => ({ ...s, missions: data || [], loading: false }));
  }, [chauffeurId]);

  useEffect(() => { if (chauffeurId) fetchMissions(); }, [chauffeurId, fetchMissions]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  const { missionAVenir, missionEnCours, missionTerminee } = useMemo(() => {
	  
	  //1. Filtrer les missions
    const terminees = missions.filter(m => m.statut === "terminee");
// 2. Trouver la dernière mission terminée
    // NOTE: Votre fetchMissions trie déjà par 'created_at' décroissant,
    // donc le premier élément [0] est le plus récent.
    const derniereMissionTerminee = terminees.length > 0 ? [terminees[0]] : [];
    return {
      missionAVenir: missions.filter(m => m.statut === "a_venir"),
      missionEnCours: missions.filter(m => m.statut === "en_cours"),
      missionTerminee: derniereMissionTerminee,
    };
  }, [missions]);

  const cards = useMemo(() => [
    { title: "À VENIR", data: missionAVenir, icon: CalendarCheck, accentColor: "border-blue-500" },
    { title: "EN COURS", data: missionEnCours, icon: Hourglass, accentColor: "border-yellow-500" },
    { title: "TERMINÉES", data: missionTerminee, icon: Archive, accentColor: "border-green-500" },
  ], [missionAVenir, missionEnCours, missionTerminee]);

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10 mr-3" />
        <p className="text-xl font-semibold text-gray-700">Connexion en cours...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DesktopSidebar navigate={navigate} />
      <MobileSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          user={user}
          handleLogout={handleLogout}
          setMenuOpen={setMenuOpen}
          profileMenu={profileMenu}
          setProfileMenu={setProfileMenu}
        />
        <main className="flex-1 flex flex-col p-6 sm:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium rounded-lg shadow-sm">
              <p className="font-bold">Erreur de chargement:</p>
              <p>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />) :
              cards.map(card => (
                <MissionCard
                  key={card.title}
                  title={card.title}
                  data={card.data}
                  icon={card.icon}
                  accentColor={card.accentColor}
                  setModalMission={setModalMission}
                />
              ))
            }
          </div>
        </main>
      </div>
      {modalMission && (
        <ModalMission
          mission={modalMission}
          onClose={() => setModalMission(null)}
          refreshMissions={fetchMissions}
        />
      )}
    </div>
  );
}
