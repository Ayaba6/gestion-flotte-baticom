import { useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";

export default function CreateTestUsers() {
  useEffect(() => {
    async function run() {
      // Liste des utilisateurs test
      const users = [
        { email: "admin@test.com", password: "password123", role: "admin" },
        { email: "superviseur@test.com", password: "password123", role: "superviseur" },
        { email: "chauffeur@test.com", password: "password123", role: "chauffeur" }
      ];

      for (const u of users) {
        try {
          // Vérifie si l'utilisateur existe déjà dans la table "users"
          const { data: existingUser, error: selectError } = await supabase
            .from("users")
            .select("id")
            .eq("email", u.email)
            .single();

          if (selectError && selectError.code !== "PGRST116") {
            // PGRST116 = no rows found → ok si l'utilisateur n'existe pas
            console.log("Erreur vérification utilisateur :", selectError.message);
            continue;
          }

          if (existingUser) {
            console.log(`Utilisateur déjà existant : ${u.email}`);
            continue;
          }

          // Crée l’utilisateur dans Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: u.email,
            password: u.password
          });

          if (authError) {
            console.log("Erreur Auth :", authError.message);
            continue;
          }

          // Ajoute l'utilisateur dans la table "users" avec le rôle
          const { error: insertError } = await supabase
            .from("users")
            .insert([{ id: authData.user.id, email: u.email, role: u.role }]);

          if (insertError) console.log("Erreur Table :", insertError.message);
          else console.log(`Utilisateur créé : ${u.email} (${u.role})`);

        } catch (err) {
          console.log("Erreur inattendue :", err);
        }
      }
    }

    run();
  }, []);

  return <div>Création des utilisateurs test… regarde la console du navigateur.</div>;
}
