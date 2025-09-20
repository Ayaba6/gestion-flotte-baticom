// src/components/ChauffeurTracker.js
import { useEffect } from "react";


function ChauffeurTracker({ missionId }) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!missionId || !userId) return;

    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [missionId, userId]);

  return null; // rien à afficher
}

export default ChauffeurTracker;
