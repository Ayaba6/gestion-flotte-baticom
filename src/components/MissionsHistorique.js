// src/pages/MissionHistorique.js - Style Minimaliste et Moderne (Proposition 2)

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Truck, 
  AlertTriangle, 
  Loader2,
  CheckCircle, // Pour le statut Terminé
  Hourglass,   // Pour le statut En cours
  CalendarDays, // Pour le statut à venir
} from "lucide-react";
import logoSociete from "../assets/logo.png";

// --- Constantes et Configuration ---
const MENU_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/chauffeur" },
  { label: "Missions", icon: Truck, path: "/missionshistorique" },
  { label: "Pannes", icon: AlertTriangle, path: "/panneshistorique" },
];

// --- Fonctions d'aide ---
const getStatusData = (statut) => {
  switch (statut) {
    case "terminee":
      return { 
        label: "Terminée", 
        color: "bg-green-500 text-white", 
        icon: CheckCircle 
      };
    case "en_cours":
      return { 
        label: "En Cours", 
        color: "bg-yellow-500 text-white", 
        icon: Hourglass 
      };
    case "a_venir":
      return { 
        label: "À Venir", 
        color: "bg-blue-500 text-white", 
        icon: CalendarDays 
      };
    default:
      return { 
        label: "Inconnu", 
        color: "bg-gray-500 text-white", 
        icon: AlertTriangle 
      };
  }
};

// --- Composants Extraits (Ajustements Visuels) ---

/**
 * Sidebar pour la navigation (Style Minimaliste et Moderne)
 */
const DesktopSidebar = ({ navigate }) => (
  <aside className="bg-blue-800 text-white w-60 hidden md:flex flex-col p-5 shadow-2xl sticky top-0 h-screen">
    <div className="flex flex-col items-center mb-10 mt-4">
      <img src={logoSociete} alt="Logo BATICOM" className="w-16 h-16 object-cover mb-3 rounded-xl bg-white p-1" />
      <h2 className="text-xl font-extrabold text-blue-200 tracking-widest uppercase">BATICOM</h2>
    </div>
    <nav className="flex flex-col gap-1 mt-6">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          // Style net et actif: Soulignement coloré en survol
          className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-left text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-200 border-l-4 border-transparent active:bg-blue-700
            ${item.path === "/missionshistorique" ? 'bg-blue-700 text-white border-blue-300' : 'hover:border-blue-300'}`}
        >
          <item.icon size={20} /> <span className="text-base">{item.label}</span>
        </button>
      ))}
    </nav>
  </aside>
);

/**
 * Header du tableau de bord (Style Minimaliste et Moderne)
 */
const DashboardHeader = ({ user, handleLogout, setMenuOpen, profileMenu, setProfileMenu }) => (
  <header className="bg-white sticky top-0 z-40 shadow-lg px-8 py-4 flex justify-between items-center border-b border-gray-200">
    <div className="flex items-center gap-4">
      <button
        onClick={() => setMenuOpen(true)}
        className="md:hidden text-blue-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={28} />
      </button>
      <h1 className="text-3xl font-bold text-gray-800">Historique des Missions</h1>
    </div>
    <div className="relative">
      <button
        onClick={() => setProfileMenu((prev) => !prev)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={profileMenu}
      >
        <User className="text-blue-600 w-6 h-6 bg-blue-50 p-1 rounded-full" />
        <span className="hidden sm:inline font-medium text-gray-700 truncate max-w-[120px]">{user?.email}</span>
      </button>
      {profileMenu && (
        <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden z-50 animate-fadeInUp">
          <div className="px-4 py-3 border-b bg-gray-50/70">
            <p className="text-sm text-gray-500">Connecté:</p>
            <p className="text-base font-semibold text-gray-800 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-left transition-colors font-medium">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  </header>
);

// --- Composant Principal : MissionHistorique ---

export default function MissionHistorique() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  // 1. Gestion de l'authentification et récupération des missions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Assure que l'indicateur tourne pendant l'attente
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) return navigate("/login");
      setUser(authUser);

      // Récupération des missions
      const { data, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("chauffeur_id", authUser.id)
        .order("created_at", { ascending: false });

      if (missionsError) {
        console.error(missionsError);
        setError("Impossible de charger l'historique des missions.");
      } else {
        setMissions(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  // 2. Déconnexion (avec useCallback pour les bonnes pratiques)
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  // 3. Rendu du chargement initial
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10 mr-3" />
        <p className="text-xl font-semibold text-gray-700">Connexion en cours...</p>
      </div>
    );
  }

  // --- Rendu Principal ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Desktop */}
      <DesktopSidebar navigate={navigate} />

      {/* Sidebar Mobile (Adapté au style minimaliste) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setMenuOpen(false)} />
          <aside className="bg-blue-800 text-white w-60 flex flex-col p-5 shadow-2xl z-50 relative">
            <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-blue-700 rounded-full">
              <X size={24} />
            </button>
            <div className="flex flex-col items-center my-6">
              <img src={logoSociete} alt="Logo" className="w-16 h-16 mb-2 rounded-xl bg-white p-1" />
              <h2 className="text-xl font-bold text-blue-200">BATICOM</h2>
            </div>
            <nav className="flex flex-col gap-1 mt-4">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-left text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-200 ${item.path === "/missionshistorique" ? 'bg-blue-700 text-white' : ''}`}
                >
                  <item.icon size={20} /> {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          user={user}
          handleLogout={handleLogout}
          setMenuOpen={setMenuOpen}
          profileMenu={profileMenu}
          setProfileMenu={setProfileMenu}
        />

        <main className="flex-1 p-6 sm:p-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-300">
            {error && (
              <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium rounded-lg">
                <p className="font-bold">Erreur de chargement:</p>
                <p>{error}</p>
              </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="animate-spin text-blue-500 w-8 h-8 mr-2" />
                    <p className="text-lg text-gray-600">Chargement des missions...</p>
                </div>
            ) : missions.length === 0 ? (
              <p className="text-gray-500 italic p-4 text-center">Aucune mission enregistrée à ce jour.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Titre</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">Date Création</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {missions.map(m => {
                        const status = getStatusData(m.statut);
                        return (
                        <tr key={m.id_uuid} className="hover:bg-blue-50 transition duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 truncate max-w-[150px]">{m.titre}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell truncate max-w-xs">{m.description || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 inline-flex items-center gap-2 text-xs font-bold rounded-full ${status.color} shadow-sm`}>
                                <status.icon size={12} /> {status.label.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{new Date(m.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}