import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder, upsertWithReorder, archiveItem, restoreItem } from "../../../lib/crud";
import { deleteFileFromSupabase, uploadFileToSupabase, compressImageToWebP } from "../../../lib/storage";
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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
                setRows([]);
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

    // Filtrar localmente
    const filteredArticles = rows.filter(article => {
        const matchesSearch = searchTerm === "" ||
            (article.title?.es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.title?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof article.title === 'string' && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                article.journal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.slug?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && !article.archived) ||
            (statusFilter === "archived" && article.archived);

        return matchesSearch && matchesStatus;
    });

    const handleAdd = () => {
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
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Investigación</h2>
                    <p className="text-muted-foreground">
                        Gestiona los artículos y publicaciones científicas.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                        <input
                            type="text"
                            placeholder="Buscar por título, revista o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border rounded-lg w-full sm:w-72 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent text-sm"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#e83d38] focus:border-transparent text-sm"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Solo Activos</option>
                            <option value="archived">Archivados</option>
                        </select>
                    </div>
                    <div className="flex gap-2 min-w-max">
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors text-sm"
                            title="Restaurar artículos desde respaldo"
                            onClick={async () => {
                                // ... same logic as ProductsView
                                try {
                                    const b = await fetchJson("/api/research/backups");
                                    const files = Array.isArray(b?.files) ? b.files : [];
                                    if (files.length) {
                                        // Placeholder for backup logic, as it's not fully provided
                                        alert("Backup functionality not fully implemented in this snippet.");
                                    }
                                } catch (error) {
                                    console.error("Error fetching backups:", error);
                                    alert("Error al cargar los respaldos.");
                                }
                            }}
                        >
                            {/* Placeholder for backup button content */}
                            Restaurar Respaldo
                        </button>
                        <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e83d38] hover:bg-red-700 text-white text-sm">
                            <Plus className="w-4 h-4" /> Nuevo Artículo
                        </button>
                    </div>
                </div>
            </div>

            <ResearchTable
                research={[...filteredArticles].sort((a, b) => {
                    if (!!a.archived && !b.archived) return 1;
                    if (!a.archived && !!b.archived) return -1;
                    const ao = typeof a.order === "number" ? a.order : 999;
                    const bo = typeof b.order === "number" ? b.order : 999;
                    return ao - bo;
                })}
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
