// src/components/PannesSection.js
import React, { useState, useEffect } from "react";
import { db, storage } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function PannesSection({ userId }) {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [gravite, setGravite] = useState("");
  const [position, setPosition] = useState(null);
  const [pannes, setPannes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Récupérer les pannes du chauffeur
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "pannes"), where("chauffeurId", "==", userId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPannes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [userId]);

  // 🔹 Récupérer position GPS automatiquement
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Impossible de récupérer la position :", err.message);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) {
      alert("Position GPS introuvable. Activez la géolocalisation.");
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (file) {
        const storageRef = ref(storage, `pannes/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "pannes"), {
        chauffeurId: userId,
        description,
        type,
        gravite,
        position,
        photoUrl,
        status: "en_attente",
        date: serverTimestamp(),
      });

      // Reset formulaire
      setDescription("");
      setFile(null);
      setType("");
      setGravite("");
    } catch (error) {
      console.error("Erreur ajout panne :", error);
      alert("Erreur lors de l'ajout de la panne");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📌 Signaler une panne</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Type de panne"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <select
          value={gravite}
          onChange={(e) => setGravite(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Sélectionnez la gravité</option>
          <option value="faible">Faible</option>
          <option value="moyenne">Moyenne</option>
          <option value="critique">Critique</option>
        </select>
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Description de la panne"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          type="submit"
          className={`w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Signaler"}
        </button>
      </form>

      <h3 className="text-lg font-semibold mt-6">📋 Mes pannes</h3>
      <ul className="mt-3 space-y-3">
        {pannes.map((p) => (
          <li key={p.id} className="p-3 border rounded shadow bg-gray-50">
            <p><strong>Type :</strong> {p.type}</p>
            <p><strong>Gravité :</strong> {p.gravite}</p>
            <p><strong>Description :</strong> {p.description}</p>
            {p.photoUrl && (
              <img
                src={p.photoUrl}
                alt="Panne"
                className="w-32 mt-2 rounded"
              />
            )}
            <p>
              <strong>Position :</strong>{" "}
              {p.position ? `${p.position.lat}, ${p.position.lng}` : "Non dispo"}
            </p>
            <p>
              <strong>Status :</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-white ${
                  p.status === "en_attente"
                    ? "bg-yellow-600"
                    : p.status === "en_cours"
                    ? "bg-blue-600"
                    : "bg-green-600"
                }`}
              >
                {p.status}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PannesSection;
