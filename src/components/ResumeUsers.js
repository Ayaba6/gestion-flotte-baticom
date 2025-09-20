// src/components/ResumeUsers.js
import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Users, Truck, UserCog } from "lucide-react"; // Icônes modernes

export default function ResumeUsers() {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [camions, setCamions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les utilisateurs
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setChauffeurs(allUsers.filter((u) => u.role === "chauffeur"));
        setSuperviseurs(allUsers.filter((u) => u.role === "superviseur"));

        // Récupérer les camions
        const camionsSnap = await getDocs(collection(db, "camions"));
        setCamions(
          camionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Erreur de chargement :", error);
      }
    };

    fetchData();
  }, []);

  const cards = [
    {
      title: "Chauffeurs",
      count: chauffeurs.length,
      icon: <Users className="w-10 h-10 text-blue-400" />,
      gradient: "from-blue-500/30 to-blue-800/30",
    },
    {
      title: "Superviseurs",
      count: superviseurs.length,
      icon: <UserCog className="w-10 h-10 text-green-400" />,
      gradient: "from-green-500/30 to-green-800/30",
    },
    {
      title: "Camions",
      count: camions.length,
      icon: <Truck className="w-10 h-10 text-yellow-400" />,
      gradient: "from-yellow-500/30 to-yellow-800/30",
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">
        Résumé de la gestion
      </h1>

      {/* Cartes vitrés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl shadow-xl bg-gradient-to-br ${card.gradient} backdrop-blur-md border border-white/20 flex items-center justify-between hover:scale-105 transition-transform duration-300`}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">
                {card.title}
              </h2>
              <p className="text-4xl font-bold text-white mt-2">
                {card.count}
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">{card.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
