// src/components/MissionsChauffeur.js
import React, { useState } from "react";
import { db } from "../services/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

function MissionsChauffeur({ missions, userId }) {
  const [loadingId, setLoadingId] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);

  const now = new Date();

  // Missions en cours
  const missionsEnCours = missions.filter(
    (m) => m.chauffeurId === userId && m.status === "en_cours"
  );

  // Missions à venir
  const missionsAVenir = missions
    .filter(
      (m) =>
        m.chauffeurId === userId &&
        (m.status === "à_venir" || m.status === undefined)
    )
    .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut));

  const handleStart = async (mission) => {
    setLoadingId(mission.id);
    try {
      await updateDoc(doc(db, "missions", mission.id), { status: "en_cours" });
    } catch (err) {
      alert(err.message);
    }
    setLoadingId(null);
  };

  const handleEnd = async (mission) => {
    setLoadingId(mission.id);
    try {
      await updateDoc(doc(db, "missions", mission.id), { status: "terminée" });
    } catch (err) {
      alert(err.message);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Mission en cours */}
      {missionsEnCours.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Mission en cours</h2>
          {missionsEnCours.map((m) => (
            <div
              key={m.id}
              className="p-4 bg-green-100 rounded-lg shadow flex justify-between items-center cursor-pointer"
              onClick={() => setSelectedMission(m)}
            >
              <div>
                <h3 className="font-semibold">{m.description}</h3>
                <p>Du {m.dateDebut} au {m.dateFin}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnd(m);
                }}
                disabled={loadingId === m.id}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                {loadingId === m.id ? "..." : "Terminer"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Missions à venir */}
      {missionsAVenir.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Missions à venir</h2>
          {missionsAVenir.map((m) => (
            <div
              key={m.id}
              className="p-4 bg-blue-100 rounded-lg shadow flex justify-between items-center cursor-pointer"
              onClick={() => setSelectedMission(m)}
            >
              <div>
                <h3 className="font-semibold">{m.description}</h3>
                <p>Du {m.dateDebut} au {m.dateFin}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStart(m);
                }}
                disabled={loadingId === m.id}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                {loadingId === m.id ? "..." : "Démarrer"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal mission */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 relative">
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-3 right-3 text-red-600 font-bold text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-2">{selectedMission.description}</h3>
            <p><strong>Camion:</strong> {selectedMission.camionId}</p>
            <p><strong>Date début:</strong> {selectedMission.dateDebut}</p>
            <p><strong>Date fin:</strong> {selectedMission.dateFin}</p>
            <p><strong>Lieu départ:</strong> {selectedMission.lieuDepart}</p>
            <p><strong>Lieu arrivée:</strong> {selectedMission.lieuArrivee}</p>
            <div className="mt-4 flex justify-end gap-2">
              {selectedMission.status === "à_venir" && (
                <button
                  onClick={() => {
                    handleStart(selectedMission);
                    setSelectedMission(null);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Démarrer
                </button>
              )}
              {selectedMission.status === "en_cours" && (
                <button
                  onClick={() => {
                    handleEnd(selectedMission);
                    setSelectedMission(null);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MissionsChauffeur;
