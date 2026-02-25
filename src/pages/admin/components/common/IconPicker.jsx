import React, { useEffect, useState } from "react";
import { RenderIcon, localIconMap, suggestedIconNames } from "./IconUtils";

export default function IconPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState("local");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 400);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    let active = true;
    async function search() {
      if (tab !== "web" || debounced.length < 3) return setResults([]);
      setLoading(true);
      try {
        const q = encodeURIComponent(debounced);
        const res = await fetch(`https://api.iconify.design/search?query=${q}`);
        const data = await res.json();
        if (!active) return;
        const items = Array.isArray(data?.icons) ? data.icons : [];
        setResults(items.map((x) => x));
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    search();
    return () => {
      active = false;
    };
  }, [tab, debounced]);

  const localIcons = Object.keys(localIconMap);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/90 rounded-xl p-5 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded border ${
                tab === "local"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
              }`}
              onClick={() => setTab("local")}
            >
              Iconos Locales
            </button>
            <button
              className={`px-3 py-1.5 rounded border ${
                tab === "web"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
              }`}
              onClick={() => setTab("web")}
            >
              Buscar en la Web
            </button>
          </div>
          <button className="text-gray-300" onClick={onClose}>
            ×
          </button>
        </div>

        {tab === "web" && (
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar icono en inglés (ej: database, brain)"
            className="w-full border rounded px-3 py-2 mb-3 bg-white"
          />
        )}

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
          {tab === "local" &&
            (localIcons.length ? localIcons : suggestedIconNames).map(
              (name) => (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  className="p-2 rounded hover:bg-red-200 flex flex-col items-center gap-1"
                >
                  <RenderIcon
                    iconName={name}
                    className="w-6 h-6 text-red-600"
                  />
                  <span className="text-[11px] text-gray-100 truncate w-full text-center">
                    {name}
                  </span>
                </button>
              )
            )}
          {tab === "web" &&
            (loading ? (
              <div className="col-span-full text-center text-sm text-gray-200">
                Buscando…
              </div>
            ) : results.length ? (
              results.slice(0, 60).map((full) => (
                <button
                  key={full}
                  onClick={() => onSelect(full)}
                  className="p-2 rounded hover:bg-red-200 flex flex-col items-center gap-1"
                >
                  <RenderIcon
                    iconName={full}
                    className="w-6 h-6 text-red-600"
                  />
                  <span className="text-[11px] text-gray-100 truncate w-full text-center">
                    {full.split(":").pop()}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center text-sm text-gray-200">
                Sin resultados
              </div>
            ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            className="w-full py-2 rounded border bg-white"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
