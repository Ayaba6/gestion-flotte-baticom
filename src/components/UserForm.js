import React, { useState } from "react";
import { createUser } from "../services/userService.js";

function UserForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("superviseur");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createUser(email, password, role);
    if (result.success) {
      setMessage(`✅ Utilisateur ${result.email} (${result.role}) créé`);
    } else {
      setMessage(`❌ Erreur : ${result.error}`);
    }
  };

  return (
    <div>
      <h2>Créer un utilisateur</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="superviseur">Superviseur</option>
          <option value="chauffeur">Chauffeur</option>
        </select>
        <button type="submit">Créer</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UserForm;
