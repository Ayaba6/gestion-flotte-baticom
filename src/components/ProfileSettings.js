import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { toast } from "react-hot-toast";

export default function ProfileSettings({ user, setUser }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user.user_metadata?.avatar || "/default-avatar.png");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Générer l'aperçu à chaque changement de fichier
  useEffect(() => {
    if (!avatarFile) return;
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  // Modifier l'avatar
  const handleAvatarChange = async () => {
    if (!avatarFile) return toast.error("Veuillez choisir une image !");
    setLoading(true);
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload dans Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      toast.error("Erreur lors de l'upload de l'avatar.");
      setLoading(false);
      return;
    }

    // Récupérer le lien public
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Mettre à jour user_metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar: publicUrlData.publicUrl }
    });

    if (updateError) {
      toast.error("Erreur lors de la mise à jour du profil.");
    } else {
      toast.success("Avatar mis à jour !");
      setUser(prev => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, avatar: publicUrlData.publicUrl }
      }));
    }
    setLoading(false);
  };

  // Modifier le mot de passe
  const handlePasswordChange = async () => {
    if (!password) return toast.error("Entrez un mot de passe !");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Erreur lors de la modification du mot de passe.");
    } else {
      toast.success("Mot de passe mis à jour !");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Profil</h2>

      {/* Avatar */}
      <div className="mb-4 flex flex-col items-center">
        <img
          src={preview}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-gray-300"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setAvatarFile(e.target.files[0])}
          className="mb-2"
        />
        <button
          onClick={handleAvatarChange}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          Mettre à jour l'avatar
        </button>
      </div>

      {/* Mot de passe */}
      <div className="mt-4">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button
          onClick={handlePasswordChange}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}
