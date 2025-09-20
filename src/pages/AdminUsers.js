import React from "react";
import CreateUserForm from "../components/CreateUserForm";

export default function AdminUsers() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Créer un utilisateur</h1>
      <CreateUserForm />
    </div>
  );
}
