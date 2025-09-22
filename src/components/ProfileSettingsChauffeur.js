// src/components/ProfileSettingsChauffeur.js
import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.js";

export default function ProfileSettingsChauffeur({ user, setUser }) {
  const [avatar, setAvatar] = useState(user?.user_metadata?.avatar || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });
    if (!error) {
      const avatarUrl = data.path;
      await supabase.auth.updateUser({ data: { avatar: avatarUrl } });
      setAvatar(avatarUrl);
      setUser((prev) => ({ ...prev, user_metadata: { ...prev.user_metadata, avatar: avatarUrl } }));
    } else {
      alert("Erreur upload avatar");
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (!password) return alert("Entrez un nouveau mot de passe");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      alert("Mot de passe mis à jour !");
      setPassword("");
    } else {
      alert("Erreur lors du changement de mot de passe");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Paramètres du profil</h2>

      <div className="mb-4">
        <img
          src={avatar || "/default-avatar.png"}
          alt="Avatar"
          className="w-24 h-24 rounded-full mb-2 border-2 border-gray-300"
        />
        <input
          type="file"
          onChange={(e) => handleAvatarUpload(e.target.files[0])}
          className="text-sm"
        />
      </div>

      <div className="mb-4">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        />
        <button
          onClick={handlePasswordChange}
          className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
          disabled={loading}
        >
          Changer mot de passe
        </button>
      </div>
    </div>
  );
}
