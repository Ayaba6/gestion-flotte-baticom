import React, { useEffect, useState } from "react";
import { db, storage } from "../services/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ResponsiveWrapper from "../components/ResponsiveWrapper";

export default function TeleverserSection() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("chauffeur");
  const [searchTerm, setSearchTerm] = useState("");
  const [allDocs, setAllDocs] = useState([]);
  const [uploadQueue, setUploadQueue] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(collection(db, "users"));
      setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const docSnap = await getDocs(collection(db, "documents"));
      setAllDocs(docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    if (activeTab === "camion") return u.role === activeTab && u.immatriculation?.toLowerCase().includes(term);
    return u.role === activeTab && u.cnib?.toLowerCase().includes(term);
  });

  const handleFileChange = (userId, index, file) => {
    setUploadQueue(prev => {
      const userFiles = prev[userId] || [{ piece: "", dateExpiration: "", file: null }];
      userFiles[index].file = file;
      return { ...prev, [userId]: userFiles };
    });
  };

  const handleFieldChange = (userId, index, field, value) => {
    setUploadQueue(prev => {
      const userFiles = prev[userId] || [{ piece: "", dateExpiration: "", file: null }];
      userFiles[index][field] = value;
      return { ...prev, [userId]: userFiles };
    });
  };

  const handleAddLine = (userId) => {
    setUploadQueue(prev => {
      const userFiles = prev[userId] || [];
      return { ...prev, [userId]: [...userFiles, { piece: "", dateExpiration: "", file: null }] };
    });
  };

  const handleUpload = async (userId) => {
    const docs = uploadQueue[userId];
    if (!docs || docs.length === 0) return alert("Aucun document à téléverser !");
    for (const docItem of docs) {
      if (!docItem.piece || !docItem.dateExpiration || !docItem.file)
        return alert("Remplissez tous les champs !");
      const storageRef = ref(storage, `documents/${userId}/${docItem.file.name}`);
      await uploadBytes(storageRef, docItem.file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "documents"), {
        userId,
        piece: docItem.piece,
        dateExpiration: docItem.dateExpiration,
        url,
        createdAt: new Date(),
      });
    }
    alert("Documents téléversés !");
    setUploadQueue(prev => ({ ...prev, [userId]: [] }));
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-xl bg-white/70 backdrop-blur-xl border border-gray-200">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">📁 Téléverser documents</h2>
          <div className="flex space-x-2">
            {["chauffeur", "superviseur", "camion"].map(tab => (
              <Button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchTerm(""); }}
                variant={activeTab === tab ? "default" : "outline"}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Recherche */}
          <Input
            type="text"
            placeholder={activeTab === "camion" ? "Recherche par immatriculation..." : "Recherche par CNIB..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-4 w-full md:w-1/3"
          />

          {/* Tableau */}
          <ResponsiveWrapper>
            <table className="min-w-full table-auto border-collapse border text-sm md:text-base">
              <thead>
                <tr className="bg-white/50">
                  <th className="border px-2 py-2 md:px-4 md:py-2">{activeTab === "camion" ? "Immatriculation" : "CNIB"}</th>
                  <th className="border px-2 py-2 md:px-4 md:py-2">Nom</th>
                  <th className="border px-2 py-2 md:px-4 md:py-2">Documents</th>
                  <th className="border px-2 py-2 md:px-4 md:py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
                {filteredUsers.map(user => {
                  const userDocs = allDocs.filter(d => d.userId === user.id);
                  const userQueue = uploadQueue[user.id] || [{ piece: "", dateExpiration: "", file: null }];
                  return (
                    <tr key={user.id} className="align-top border hover:bg-white/30">
                      <td data-label={activeTab === "camion" ? "Immatriculation" : "CNIB"} className="border px-2 py-2 md:px-4 md:py-2">
                        {activeTab === "camion" ? user.immatriculation : user.cnib}
                      </td>
                      <td data-label="Nom" className="border px-2 py-2 md:px-4 md:py-2">{user.nom || user.name}</td>
                      <td data-label="Documents" className="border px-2 py-2 md:px-4 md:py-2">
                        {userDocs.length === 0 ? (
                          <span className="text-gray-500">Aucun document</span>
                        ) : (
                          <ul className="list-disc pl-4">
                            {userDocs.map(doc => (
                              <li key={doc.id}>
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                  {doc.piece} (exp: {doc.dateExpiration})
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td data-label="Actions" className="border px-2 py-2 md:px-4 md:py-2">
                        <div className="flex flex-col gap-2">
                          {userQueue.map((docItem, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                              <select
                                value={docItem.piece}
                                onChange={e => handleFieldChange(user.id, index, "piece", e.target.value)}
                                className="border p-1 rounded w-full md:w-32"
                              >
                                <option value="">Sélectionnez</option>
                                <option value="Carte d'identité">Carte d'identité</option>
                                <option value="Permis">Permis</option>
                                <option value="Assurance">Assurance</option>
                                <option value="Carte grise">Carte grise</option>
                              </select>
                              <Input
                                type="date"
                                value={docItem.dateExpiration}
                                onChange={e => handleFieldChange(user.id, index, "dateExpiration", e.target.value)}
                                className="w-full md:w-32"
                              />
                              <input
                                type="file"
                                onChange={e => handleFileChange(user.id, index, e.target.files[0])}
                                className="border p-1 rounded w-full md:w-32"
                              />
                            </div>
                          ))}
                          <div className="flex flex-col md:flex-row gap-2 mt-2">
                            <Button size="sm" variant="outline" className="w-full md:w-auto" onClick={() => handleAddLine(user.id)}>+ Document</Button>
                            <Button size="sm" className="w-full md:w-auto" onClick={() => handleUpload(user.id)}>Téléverser</Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveWrapper>
        </CardContent>
      </Card>
    </div>
  );
}
