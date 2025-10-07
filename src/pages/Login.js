// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

// Configuration des rôles et des routes
const ROLE_REDIRECTS = {
  admin: "/admin",
  superviseur: "/superviseur",
  chauffeur: "/chauffeur",
};

// Composant pour l'effet de scintillement (si vous utilisez un système comme HeroIcons ou une librairie d'animation)
// Pour l'instant, nous utiliserons une simple div stylisée comme un point lumineux.
const Scintillant = ({ delay }) => (
  <div
    className="absolute w-1 h-1 bg-white/70 rounded-full animate-scintillement"
    style={{ animationDelay: delay }}
  ></div>
);

// --- Définition des animations Tailwind CSS (à ajouter dans votre fichier CSS principal si vous ne pouvez pas les définir en JSX) ---
/* @layer components {
  @keyframes scintillement {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1); }
  }
  .animate-scintillement {
    animation: scintillement 3s infinite ease-in-out;
  }
}
*/

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fonction de gestion des erreurs (inchangée)
  const getFriendlyErrorMessage = (error) => {
    if (error.message.includes("Invalid login credentials")) {
      return "Email ou mot de passe invalide. Veuillez vérifier vos informations.";
    }
    if (error.message.includes("Row not found")) {
      return "Compte utilisateur introuvable ou rôle non attribué. Contactez l'administrateur.";
    }
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  };

  // Fonction de connexion (inchangée)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Authentification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMessage(getFriendlyErrorMessage(authError));
        return;
      }

      // 2. Vérification du rôle et récupération du profil
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile || !profile.role) {
        await supabase.auth.signOut();
        setErrorMessage(getFriendlyErrorMessage(profileError || new Error("Row not found")));
        return;
      }

      // 3. Redirection basée sur le rôle
      const redirectPath = ROLE_REDIRECTS[profile.role] || "/";
      navigate(redirectPath);

    } catch (error) {
      console.error("Erreur critique de connexion:", error);
      setErrorMessage("Échec critique de l'opération de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-2xl rounded-xl flex w-full max-w-4xl overflow-hidden border border-gray-200">
        
        {/* MODIFICATION MAJEURE ICI : Left Branding avec effet dynamique */}
        <div className="hidden md:flex flex-col items-center justify-center bg-green-800 text-white w-2/5 p-10 relative overflow-hidden">
          
          {/* FOND DYNAMIQUE : Grille Interconnectée Scintillante */}
          <div className="absolute inset-0 opacity-10">
            {/* Vous pouvez générer ces points de manière dynamique si vous le souhaitez */}
            <Scintillant delay="0s" className="top-1/4 left-1/4" />
            <Scintillant delay="1s" className="top-3/4 left-1/3" />
            <Scintillant delay="2s" className="top-1/2 left-3/4" />
            <Scintillant delay="0.5s" className="top-1/12 left-1/2" />
            <Scintillant delay="1.5s" className="top-2/3 left-1/6" />
            <Scintillant delay="2.5s" className="top-1/5 right-1/5" />
          </div>

          {/* Ajout d'une pseudo-grille pour l'effet d'interconnexion (optionnel) */}
          <div className="absolute inset-0 bg-repeat opacity-5" style={{
            backgroundImage: "linear-gradient(to right, #00C853 1px, transparent 1px), linear-gradient(to bottom, #00C853 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}></div>
          

          {/* Contenu de la marque au premier plan (z-10) */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <img 
                src={logoSociete} 
                alt="Logo BATICOM" 
                className="w-24 h-24 object-contain mb-4 filter drop-shadow-lg" 
            />
            <h1 className="text-5xl font-extrabold tracking-widest text-white shadow-text">BATICOM</h1>
            <p className="text-green-200 text-center font-light leading-relaxed text-lg">
              Portail de gestion de la flotte 🚛 et des opérations.
            </p>
          </div>
        </div>

        {/* Right Form (inchangé, mais utilise les améliorations précédentes) */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">Connexion Sécurisée</h2>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm font-medium text-center shadow-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition duration-150">
                <Mail className="text-gray-400 w-5 h-5 ml-3" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@entreprise.com"
                  required
                  autoComplete="email"
                  className="w-full p-3 pl-2 pr-4 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2 text-sm">Mot de passe</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition duration-150">
                <Lock className="text-gray-400 w-5 h-5 ml-3" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe"
                  required
                  autoComplete="current-password"
                  className="w-full p-3 pl-2 pr-12 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 p-1 text-gray-500 hover:text-gray-700 transition"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Bouton de Connexion */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 mt-4 bg-green-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-green-700 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={20} />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400">
            © 2025 BATICOM. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}