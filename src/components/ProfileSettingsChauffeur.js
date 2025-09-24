// src/components/ProfileSettingsChauffeur.js
import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { toast } from "react-hot-toast";

export default function ProfileSettingsChauffeur({ user, setUser }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.fullName || "");
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    let avatarUrl = user?.user_metadata?.avatar || null;

    // Upload avatar si modifié
    if (avatar) {
      const fileExt = avatar.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatar, { upsert: true });

      if (error) {
        console.error(error);
        toast.error("Erreur lors de l'upload de l'avatar");
        setLoading(false);
        return;
      }
      avatarUrl = data.path;
    }

    // Mise à jour du profil utilisateur
    const { data: updatedUser, error } = await supabase.auth.updateUser({
      data: {
        fullName,
        avatar: avatarUrl,
      },
    });

    if (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du profil");
    } else {
      setUser({ ...user, user_metadata: { ...user.user_metadata, fullName, avatar: avatarUrl } });
      toast.success("Profil mis à jour !");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Mes informations</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Nom complet</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files[0])}
          className="w-full text-sm"
        />
        {user?.user_metadata?.avatar && !avatar && (
          <img
            src={supabase.storage.from("avatars").getPublicUrl(user.user_metadata.avatar).publicUrl}
            alt="Avatar"
            className="w-20 h-20 rounded-full mt-2"
          />
        )}
      </div>

      <button
        onClick={handleSave}
        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
      >
        {loading ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}
