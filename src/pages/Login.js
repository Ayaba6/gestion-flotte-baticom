// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Identifiants invalides. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setErrorMessage("Votre compte n'est pas correctement configuré.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin") navigate("/admin");
    else if (profile.role === "superviseur") navigate("/superviseur");
    else if (profile.role === "chauffeur") navigate("/chauffeur");
    else navigate("/");

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-5xl overflow-hidden">
        {/* Left Branding */}
        <div className="hidden md:flex flex-col items-center justify-center bg-green-700 text-white w-2/5 p-10">
          <img src={logoSociete} alt="Logo" className="w-32 h-32 mb-6 object-contain" />
          <h1 className="text-4xl font-bold mb-2">BATICOM</h1>
          <p className="text-gray-200 text-center">Portail de gestion de la flotte et utilisateurs</p>
        </div>

        {/* Right Form */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Connexion</h2>

          {errorMessage && (
            <div className="mb-4 text-red-600 font-semibold text-center">{errorMessage}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-600">
                <Mail className="text-gray-400 w-5 h-5 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  className="w-full outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Mot de passe</label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-600">
                <Lock className="text-gray-400 w-5 h-5 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="w-full outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            © 2025 BATICOM. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
