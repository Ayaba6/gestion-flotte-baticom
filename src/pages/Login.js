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

// Composant scintillant pour effet dynamique
const Scintillant = ({ delay }) => (
  <div
    className="absolute w-1 h-1 bg-white/70 rounded-full animate-scintillement"
    style={{ animationDelay: delay }}
  ></div>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getFriendlyErrorMessage = (error) => {
    if (error.message.includes("Invalid login credentials")) {
      return "Email ou mot de passe invalide. Veuillez vérifier vos informations.";
    }
    if (error.message.includes("Row not found")) {
      return "Compte utilisateur introuvable ou rôle non attribué. Contactez l'administrateur.";
    }
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMessage(getFriendlyErrorMessage(authError));
        return;
      }

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

      const redirectPath = ROLE_REDIRECTS[profile.role] || "/";
      navigate(redirectPath);

    } catch (error) {
      console.error("Erreur critique de connexion:", error);
      setErrorMessage("Échec critique de l'opération de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white shadow-2xl rounded-xl flex w-full max-w-4xl overflow-hidden border border-gray-200">
        
        {/* Left Branding */}
        <div className="hidden md:flex flex-col items-center justify-center bg-blue-600 text-white w-2/5 p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Scintillant delay="0s" />
            <Scintillant delay="1s" />
            <Scintillant delay="2s" />
            <Scintillant delay="0.5s" />
            <Scintillant delay="1.5s" />
            <Scintillant delay="2.5s" />
          </div>
          <div className="absolute inset-0 bg-repeat opacity-5" style={{
            backgroundImage: "linear-gradient(to right, #00BFFF 1px, transparent 1px), linear-gradient(to bottom, #00BFFF 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}></div>
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <img src={logoSociete} alt="Logo BATICOM" className="w-24 h-24 object-contain mb-4 filter drop-shadow-lg" />
            <h1 className="text-5xl font-extrabold tracking-widest text-white shadow-text">BATICOM</h1>
            <p className="text-blue-200 text-center font-light leading-relaxed text-lg">
              Portail de gestion de la flotte 🚛 et des opérations.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center bg-gradient-to-b from-blue-50 to-white">
          <h2 className="text-3xl font-extrabold text-blue-600 mb-8 text-center">Connexion Sécurisée</h2>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium text-center shadow-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition duration-150">
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2 text-sm">Mot de passe</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition duration-150">
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

            {/* Bouton Connexion */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 mt-4 bg-blue-500 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-blue-600 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
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
