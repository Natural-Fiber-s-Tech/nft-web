import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ServicesTable from "../components/services/ServicesTable";
import ServiceFormModal from "../components/services/ServiceFormModal";
import ArchiveConfirmModal from "../components/services/ArchiveConfirmModal";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder } from "../../../lib/crud";

export default function ServicesView() {
    const [rows, setRows] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState("view");
    const [confirmRow, setConfirmRow] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    async function loadServices() {
        try {
            const { collection, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const querySnapshot = await getDocs(collection(db, "services"));

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRows(normalizeOrder(data));
            } else {
                // Si la colección de Firestore está vacía, intentar fallback a JSON y migrar
                const r = await fetch("/content/services.json");
                if (r.ok) {
                    const raw = await r.json();
                    const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
                    if (data.length) {
                        const normalized = normalizeOrder(data);
                        setRows(normalized);
                        await persistRows(normalized, "seed services from public content");
                    }
                } else {
                    setRows([]);
                }
            }
        } catch (error) {
            console.error("Error cargando servicios desde Firestore:", error);
            setRows([]);
        }
    }

    async function persistRows(nextRows, reason = "auto-save") {
        try {
            const { doc, writeBatch } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const batch = writeBatch(db);
            nextRows.forEach((item) => {
                const itemRef = doc(db, "services", item.id);
                batch.set(itemRef, item, { merge: true });
            });
            await batch.commit();

            return true;
        } catch (e) {
            console.warn("Auto-persist failed in Firestore:", e?.message || e);
            return false;
        }
    }

    function newService() {
        const blank = {
            id: "service-" + Math.random().toString(36).slice(2, 8),
            icon: "Brain",
            title: { es: "", en: "" },
            description: { es: "", en: "" },
            features: { es: [], en: [] },
            order: (rows?.length || 0) + 1,
            whatsapp: "51988496839",
            archived: false,
        };
        setEditing(blank);
        setModalMode("create");
        setShowForm(true);
    }

    function editService(row) {
        setEditing(JSON.parse(JSON.stringify(row)));
        setModalMode("edit");
        setShowForm(true);
    }

    // Calculate table rows (active then archived)
    const tableRows = [...rows].sort((a, b) => {
        if (!!a.archived && !b.archived) return 1;
        if (!a.archived && !!b.archived) return -1;
        const ao = typeof a.order === "number" ? a.order : 999;
        const bo = typeof b.order === "number" ? b.order : 999;
        return ao - bo;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    onClick={newService}
                >
                    <Plus className="w-4 h-4" /> Nuevo Servicio
                </button>
            </div>

            <ServicesTable
                services={tableRows}
                onView={(row) => {
                    setEditing(row);
                    setModalMode("view");
                    setShowForm(true);
                }}
                onEdit={(row) => editService(row)}
                onArchiveToggle={(row) => {
                    setConfirmRow(row);
                    setShowConfirm(true);
                }}
                onOrderChange={async (service, newOrder) => {
                    const prev = rows;
                    const others = prev.filter((r) => r.id !== service.id);
                    const compact = normalizeOrder(others);
                    const active = compact.filter((x) => !x.archived);
                    const activeCount = active.length;
                    const req = typeof newOrder === "number" ? newOrder : activeCount + 1;
                    const target = Math.max(1, Math.min(req, activeCount + 1));
                    const shifted = compact.map((r) => {
                        if (!r.archived && Number(r.order) >= target) {
                            return { ...r, order: Number(r.order) + 1 };
                        }
                        return r;
                    });
                    const next = [
                        ...shifted,
                        { ...service, order: target },
                    ];
                    const nextComputed = normalizeOrder(next);
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed);
                    if (!ok) alert("No se pudo guardar el nuevo orden.");
                    else loadServices();
                }}
                onDelete={async (service) => {
                    if (window.confirm(`¿Seguro que deseas eliminar permanentemente el servicio "${service.title?.es || service.id}"?\n\nEsta acción no se puede deshacer.`)) {
                        try {
                            const { doc, deleteDoc } = await import("firebase/firestore");
                            const { db } = await import("../../../config/firebase");

                            await deleteDoc(doc(db, "services", service.id));

                            const nextRows = rows.filter(r => r.id !== service.id);
                            const normalized = normalizeOrder(nextRows);
                            setRows(normalized);
                            await persistRows(normalized);

                            loadServices();
                        } catch (err) {
                            console.error("Error al eliminar servicio:", err);
                            alert("Hubo un error al eliminar el servicio. Intenta de nuevo.");
                        }
                    }
                }}
            />

            <ServiceFormModal
                open={showForm}
                mode={modalMode}
                service={editing}
                onClose={() => setShowForm(false)}
                onSave={async (payload) => {
                    const others = rows.filter((r) => r.id !== payload.id);
                    const compact = normalizeOrder(others);
                    let nextComputed;
                    if (payload.archived) {
                        nextComputed = normalizeOrder([...compact, payload]);
                    } else {
                        const active = compact.filter((x) => !x.archived);
                        const activeCount = active.length;
                        const req = Number(payload.order) || activeCount + 1;
                        const target = Math.max(1, Math.min(req, activeCount + 1));
                        const shifted = compact.map((r) => {
                            if (!r.archived && Number(r.order) >= target) {
                                return { ...r, order: Number(r.order) + 1 };
                            }
                            return r;
                        });
                        const next = [...shifted, { ...payload, archived: false, order: target }];
                        nextComputed = normalizeOrder(next);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: onSave service");
                    if (!ok) {
                        alert("No se pudo guardar. Verifique conexión.");
                    } else {
                        loadServices();
                    }
                    setShowForm(false);
                }}
                onRestore={async (toRestore) => {
                    if (!toRestore) return;
                    const compact = normalizeOrder(rows);
                    const active = compact.filter((x) => !x.archived);
                    const max = Math.max(0, ...active.map((x) => Number(x.order) || 0));
                    const req = Math.max(1, Math.min(Number(toRestore.order) || max + 1, max + 1));
                    const shifted = compact.map((r) => {
                        if (!r.archived && Number(r.order) >= req) {
                            return { ...r, order: Number(r.order) + 1 };
                        }
                        return r;
                    });
                    const next = shifted.map((r) =>
                        r.id === toRestore.id ? { ...r, archived: false, order: req } : r
                    );
                    const nextComputed = normalizeOrder(next);
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: restore service");
                    if (!ok) alert("No se pudo restaurar.");
                    else loadServices();
                    setShowForm(false);
                }}
            />

            <ArchiveConfirmModal
                open={showConfirm}
                service={confirmRow}
                activeCount={rows.filter((x) => !x.archived).length}
                onClose={() => setShowConfirm(false)}
                onConfirm={async (restoreAt) => {
                    if (!confirmRow) return;
                    const willArchive = !confirmRow.archived;
                    let nextComputed;
                    if (willArchive) {
                        const mapped = rows.map((r) =>
                            r.id === confirmRow.id ? { ...r, archived: true, order: r.order } : r
                        );
                        nextComputed = normalizeOrder(mapped);
                    } else {
                        const compact = normalizeOrder(rows);
                        // ... restore calculation roughly duplicated for brevity, ideally shared logic
                        const active = compact.filter((x) => !x.archived);
                        const max = Math.max(0, ...active.map((x) => Number(x.order) || 0));
                        const target = typeof restoreAt === "number" ? Math.max(1, Math.min(restoreAt, max + 1)) : max + 1;
                        const shifted = compact.map((r) => {
                            if (!r.archived && Number(r.order) >= target) {
                                return { ...r, order: Number(r.order) + 1 };
                            }
                            return r;
                        });
                        const next = shifted.map((r) =>
                            r.id === confirmRow.id ? { ...r, archived: false, order: target } : r
                        );
                        nextComputed = normalizeOrder(next);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, willArchive ? "archive" : "restore");
                    if (!ok) alert("Error persistencia");
                    else loadServices();
                    setShowConfirm(false);
                }}
            />
        </div>
    );
}
