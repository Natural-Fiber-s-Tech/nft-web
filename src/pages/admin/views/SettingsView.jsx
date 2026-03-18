import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export default function SettingsView() {
  const [formData, setFormData] = useState({
    email: "naturalfiberstech@gmail.com",
    phone: "+51 988 496 839",
    whatsapp: "+51 988 496 839",
    useSamePhone: true,
    facebook: "https://www.facebook.com/p/Natural-Fibers-Tech-SAC-100064291801913/",
    instagram: "https://instagram.com/nft_sac/",
    linkedin: "https://www.linkedin.com/company/fibers-tech/?originalSubdomain=pe",
    youtube: "https://www.youtube.com/@naturalfiberstech953",
    tiktok: "https://www.tiktok.com/@nft_sac?lang=es-419",
    x: "https://x.com/fibers_tech",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const docRef = doc(db, "settings", "site_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData((prev) => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Error cargando la configuración." });
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e, field) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (!digits.startsWith('51')) {
      digits = '51' + digits;
    }
    const local = digits.slice(2, 11); // Typical Peruvian phone is 9 digits
    const groups = local.match(/.{1,3}/g) || [];
    const formatted = '+51' + (groups.length ? ' ' + groups.join(' ') : '');
    setFormData((prev) => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const dataToSave = { ...formData };
      if (dataToSave.useSamePhone) {
        dataToSave.whatsapp = dataToSave.phone;
      }
      
      const docRef = doc(db, "settings", "site_config");
      await setDoc(docRef, dataToSave, { merge: true });
      setMessage({ type: "success", text: "Configuración guardada exitosamente." });
      
      // Sync local state as well
      setFormData(dataToSave);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Error guardando la configuración." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración General</h2>
        <p className="text-muted-foreground">
          Gestiona los números de contacto, correos electrónicos y enlaces de redes sociales.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Información de Contacto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e, 'phone')}
                placeholder="+51 988 496 839"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Llamadas regulares. Incluir código de país e.g., +51</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.useSamePhone ? formData.phone : formData.whatsapp}
                onChange={(e) => handlePhoneChange(e, 'whatsapp')}
                disabled={formData.useSamePhone}
                placeholder="+51 988 496 839"
                required={!formData.useSamePhone}
                className={`w-full px-4 py-2 border rounded-lg outline-none ${formData.useSamePhone ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-red-500'}`}
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="useSamePhone"
                  name="useSamePhone"
                  checked={formData.useSamePhone}
                  onChange={(e) => setFormData(p => ({ ...p, useSamePhone: e.target.checked }))}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="useSamePhone" className="ml-2 text-sm text-gray-700">Usar el mismo número para WhatsApp</label>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold border-b pb-2">Redes Sociales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
              <input
                type="url"
                name="youtube"
                value={formData.youtube}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
              <input
                type="url"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                placeholder="https://tiktok.com/@..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X (Twitter) URL</label>
              <input
                type="url"
                name="x"
                value={formData.x}
                onChange={handleChange}
                placeholder="https://x.com/..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-all ${
              saving ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
