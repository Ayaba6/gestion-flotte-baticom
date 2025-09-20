// src/components/HistoriqueMissions.js
import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

function HistoriqueMissions({ userId }) {
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    const fetchMissions = async () => {
      const q = query(collection(db, "missions"), where("chauffeurId", "==", userId));
      const snapshot = await getDocs(q);
      setMissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMissions();
  }, [userId]);

  if (missions.length === 0) return <p>Aucune mission précédente.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {missions.map(m => (
        <div key={m.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <p><span className="font-semibold">Camion :</span> {m.camion}</p>
          <p><span className="font-semibold">Destination :</span> {m.destination}</p>
          <p><span className="font-semibold">Statut :</span> {m.statut}</p>
        </div>
      ))}
    </div>
  );
}

export default HistoriqueMissions;
