import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

export function useSiteSettings() {
  const [settings, setSettings] = useState({
    email: "naturalfiberstech@gmail.com",
    phone: "+51 988 496 839",
    whatsapp: "+51 988 496 839",
    useSamePhone: true,
    facebook: "https://www.facebook.com/p/Natural-Fibers-Tech-SAC-100064291801913/",
    instagram: "https://instagram.com/nft_sac/",
    linkedin: "https://www.linkedin.com/company/fibers-tech/?originalSubdomain=pe",
    youtube: "https://www.youtube.com/@naturalfiberstech953",
    tiktok: "https://www.tiktok.com/@nft_sac?lang=es-419",
    x: "https://x.com/fibers_tech"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "site_config"),
      (docSnap) => {
        if (docSnap.exists()) {
          // Merge fetched data over default configuration
          setSettings((prev) => ({ ...prev, ...docSnap.data() }));
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching site settings:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { settings, loading, error };
}
