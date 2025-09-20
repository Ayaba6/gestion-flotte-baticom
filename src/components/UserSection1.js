import React, { useEffect, useState } from "react";

export default function UserSection() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "superviseur",
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Fetch users from Supabase via backend
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/list-users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des utilisateurs");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create new user
  const handleCreate = async () => {
    const { email, password, role } = formData;
    if (!email || !password) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setFormData({ email: "", password: "", role: "superviseur" });
        setShowForm(false);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      const res = await fetch(`http://localhost:5000/delete-user/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Gestion des utilisateurs</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Annuler" : "Créer un utilisateur"}
      </button>

      {showForm && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="superviseur">Superviseur</option>
            <option value="chauffeur">Chauffeur</option>
          </select>
          <button onClick={handleCreate} disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      )}

      <h3 style={{ marginTop: "20px" }}>Liste des utilisateurs</h3>
      <table border="1" cellPadding="5" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="3">Aucun utilisateur</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => handleDelete(user.id)}>Supprimer</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
