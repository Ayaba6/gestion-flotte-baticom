// src/components/ProfilUser.js
import React, { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import ProfileSettingsChauffeur from "./ProfileSettingsChauffeur.js";
import { supabase } from "../services/supabaseClient.js";

export default function ProfilUser({ user, setUser }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="relative">
      {/* Avatar + email */}
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setOpenMenu(!openMenu)}
      >
        <img
          src={user?.user_metadata?.avatar || "/default-avatar.png"}
          alt="Avatar"
          className="w-10 h-10 rounded-full border-2 border-gray-300"
        />
        <span className="hidden sm:block font-medium text-gray-700 truncate max-w-[150px]">
          {user?.email}
        </span>
      </div>

      {/* Menu déroulant */}
      {openMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-50">
          <button
            onClick={() => { setOpenModal(true); setOpenMenu(false); }}
            className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100"
          >
            <Settings size={16} /> Paramètres
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:bg-gray-100"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}

      {/* Modal Paramètres */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <ProfileSettingsChauffeur user={user} setUser={setUser} />
          </div>
        </div>
      )}
    </div>
  );
}
