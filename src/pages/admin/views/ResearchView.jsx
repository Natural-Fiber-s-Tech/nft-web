import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder, upsertWithReorder, archiveItem, restoreItem } from "../../../lib/crud";
import { deleteFileFromSupabase } from "../../../lib/storage";
import ResearchTable from "../components/research/ResearchTable";
import ResearchFormModal from "../components/research/ResearchFormModal";
import ResearchArchiveConfirmModal from "../components/research/ResearchArchiveConfirmModal";
import ConfirmModal from "../components/common/ConfirmModal";

export default function ResearchView() {
    const [rows, setRows] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState("view");
    const [confirmRow, setConfirmRow] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadResearch();
    }, []);
    async function loadResearch() {
        try {
            const { collection, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const querySnapshot = await getDocs(collection(db, "research"));

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                const uniqueData = data.reduce((acc, item) => {
                    if (!acc.some((existing) => existing.slug === item.slug)) {
                        acc.push(item);
                    }
                    return acc;
                }, []);
                setRows(normalizeOrder(uniqueData));
            } else {
                const r = await fetch("/content/research.json");
                if (r.ok) {
                    const raw = await r.json();
                    const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
                    if (data.length) {
                        const uniqueData = data.reduce((acc, item) => {
                            if (!acc.some((existing) => existing.slug === item.slug)) acc.push(item);
                            return acc;
                        }, []);
                        const normalized = normalizeOrder(uniqueData);
                        setRows(normalized);
                        await persistRows(normalized, "seed research from public content");
                    }
                } else {
                    setRows([]);
                }
            }
        } catch (error) {
            console.error("Error cargando investigación desde Firestore:", error);
            setRows([]);
        }
    }

    async function persistRows(nextRows, reason = "auto-save") {
        try {
            const { doc, writeBatch } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const batch = writeBatch(db);
            const isLocalUrl = (v) => typeof v === 'string' && (v.startsWith('blob:') || v.startsWith('data:'));
            nextRows.forEach((item) => {
                // Sanitize: strip local URLs before saving to Firestore
                const safe = Object.fromEntries(
                    Object.entries(item).map(([k, v]) => [k, isLocalUrl(v) ? "" : v])
                );
                const itemRef = doc(db, "research", safe.id);
                batch.set(itemRef, safe, { merge: true });
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.warn("Auto-persist research failed in Firestore:", e);
            return false;
        }
    }

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
                    onClick={() => {
                        const blank = {
                            id: "research-" + Math.random().toString(36).slice(2, 8),
                            slug: "",
                            order: (rows?.filter((x) => !x.archived).length || 0) + 1,
                            localImage: "",
                            journal: "",
                            date: new Date().toISOString().split("T")[0],
                            title: { es: "", en: "" },
                            summary_30w: { es: "", en: "" },
                            keywords: [],
                            products: [],
                            fullSummary: { es: "", en: "" },
                            methodology: { es: "", en: "" },
                            results: { es: "", en: "" },
                            conclusions: { es: "", en: "" },
                            download_link_DOI: "",
                            download_link_pdf: "",
                            href: "",
                            archived: false,
                        };
                        setEditing(blank);
                        setModalMode("create");
                        setShowForm(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> Nuevo Artículo
                </button>
            </div>

            <ResearchTable
                research={tableRows}
                onView={(row) => {
                    setEditing(row);
                    setModalMode("view");
                    setShowForm(true);
                }}
                onEdit={(row) => {
                    setEditing(JSON.parse(JSON.stringify(row)));
                    setModalMode("edit");
                    setShowForm(true);
                }}
                onArchiveToggle={(row) => {
                    if (row.archived) {
                        setEditing(JSON.parse(JSON.stringify(row)));
                        setModalMode("restore");
                        setShowForm(true);
                    } else {
                        setConfirmRow(row);
                        setShowConfirm(true);
                    }
                }}
                onDelete={(row) => {
                    setDeleteRow(row);
                    setShowDeleteConfirm(true);
                }}
            />

            <ResearchFormModal
                open={showForm}
                article={editing}
                onClose={() => setShowForm(false)}
                mode={modalMode}
                allRows={rows}
                onSave={async (payload) => {
                    let nextComputed = [];
                    setRows((prev) => {
                        nextComputed = upsertWithReorder(prev, payload);
                        return nextComputed;
                    });
                    const ok = await persistRows(nextComputed, "auto-save: onSave research");
                    if (!ok) alert("Error saving research");
                    else loadResearch();
                    setShowForm(false);
                }}
                onRestore={async (payload) => {
                    let nextComputed = [];
                    setRows((prev) => {
                        const payloadWithActiveState = { ...payload, archived: false };
                        nextComputed = upsertWithReorder(prev, payloadWithActiveState);
                        return nextComputed;
                    });
                    const ok = await persistRows(nextComputed, "auto-save: restore research");
                    if (!ok) alert("Error restoring research");
                    else loadResearch();
                    setShowForm(false);
                }}
            />

            <ResearchArchiveConfirmModal
                open={showConfirm}
                article={confirmRow}
                onCancel={() => {
                    setShowConfirm(false);
                    setConfirmRow(null);
                }}
                onConfirm={async () => {
                    if (!confirmRow) return;
                    const isArchiving = !confirmRow.archived;
                    let nextComputed = [];
                    if (isArchiving) {
                        nextComputed = archiveItem(rows, confirmRow);
                    } else {
                        nextComputed = restoreItem(rows, confirmRow);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, isArchiving ? "archive" : "restore");
                    if (!ok) alert("Error persisting research change");
                    else loadResearch();
                    setShowConfirm(false);
                    setConfirmRow(null);
                }}
            />

            <ConfirmModal
                open={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeleteRow(null);
                }}
                onConfirm={async () => {
                    if (!deleteRow) return;
                    try {
                        // 1. Borrar archivos de Supabase (silencioso si fallan)
                        await Promise.allSettled([
                            deleteFileFromSupabase(deleteRow.localImage),
                            deleteFileFromSupabase(deleteRow.download_link_pdf),
                        ]);

                        // 2. Borrar documento de Firestore
                        const { doc, deleteDoc } = await import("firebase/firestore");
                        const { db } = await import("../../../config/firebase");
                        await deleteDoc(doc(db, "research", deleteRow.id));

                        setRows(prev => prev.filter(r => r.id !== deleteRow.id));
                        loadResearch();
                    } catch (error) {
                        console.error("Error deleting research item:", error);
                        alert("Hubo un error al eliminar el artículo.");
                    } finally {
                        setShowDeleteConfirm(false);
                        setDeleteRow(null);
                    }
                }}
                title="Eliminar Artículo Permanentemente"
                message={`¿Estás seguro que deseas eliminar el artículo "${deleteRow?.title?.es || deleteRow?.title?.en}"?\n\nEsta acción no se puede deshacer y el artículo dejará de aparecer en la web.`}
                type="error"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
}
