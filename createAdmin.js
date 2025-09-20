// createAdmin.js
import supabaseAdmin from "./src/services/supabaseAdminClient.js";

async function createAdmin() {
  const email = "admin@test.com";
  const password = "Password123!";

  try {
    // Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;

    const userId = authData.user.id;

    // Créer le profil dans la table profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      { id: userId, role: "admin" }
    ]);
    if (profileError) throw profileError;

    console.log("Admin créé avec succès !", email, password);
  } catch (err) {
    console.error(err);
  }
}

createAdmin();
