// src/api/userApi.js
export async function createUser(userData) {
  const res = await fetch("http://localhost:4000/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function getUsers() {
  const res = await fetch("http://localhost:4000/users");
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`http://localhost:4000/delete-user/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`http://localhost:4000/update-user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
