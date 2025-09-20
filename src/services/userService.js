export async function createUser(email, password, role) {
  try {
    const response = await fetch("http://localhost:4000/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Erreur fetch :", err);
    return { success: false, error: err.message };
  }
}
