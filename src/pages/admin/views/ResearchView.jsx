import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder, upsertWithReorder, archiveItem, restoreItem } from "../../../lib/crud";
import { deleteFileFromSupabase, uploadFileToSupabase, compressImageToWebP } from "../../../lib/storage";
import ResearchTable from "../components/research/ResearchTable";
import ResearchFormModal from "../components/research/ResearchFormModal";
import ResearchArchiveConfirmModal from "../components/research/ResearchArchiveConfirmModal";
import NotifyConfirmModal from "../components/common/NotifyConfirmModal";

export default function ResearchView() {
    const [rows, setRows] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState("view");
    const [confirmRow, setConfirmRow] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [notifyRow, setNotifyRow] = useState(null);
    const [showNotifyConfirm, setShowNotifyConfirm] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    // Ordering State
    const [isOrderDirty, setIsOrderDirty] = useState(false);

    useEffect(() => {
        loadResearch();
    }, []);

    async function loadResearch(forceRefresh = false) {
        try {
            if (forceRefresh) {
                sessionStorage.removeItem("nft_research_cache");
                sessionStorage.removeItem("nft_research_cache_time");
            } else {
                const cached = sessionStorage.getItem("nft_research_cache");
                const cacheTime = sessionStorage.getItem("nft_research_cache_time");
                if (cached && cacheTime) {
                    const MathAge = Date.now() - parseInt(cacheTime, 10);
                    if (MathAge < 86400000) {
                        console.log("⚡ Research loaded from Session Storage");
                        setRows(JSON.parse(cached));
                        return;
                    }
                }
            }
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
                const finalRows = normalizeOrder(uniqueData);
                
                sessionStorage.setItem("nft_research_cache", JSON.stringify(finalRows));
                sessionStorage.setItem("nft_research_cache_time", Date.now().toString());
                
                setRows(finalRows);
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
            
            // Clear cache after persisting so next load is fresh
            sessionStorage.removeItem("nft_research_cache");
            sessionStorage.removeItem("nft_research_cache_time");
            
            return true;
        } catch (e) {
            console.warn("Auto-persist research failed in Firestore:", e);
            return false;
        }
    }

    const handleNotifyLaunch = async (item, itemType) => {
        try {
            const { getAuth } = await import("firebase/auth");
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No estás autenticado como administrador.");
            const token = await user.getIdToken();
            
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/notify-launch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ itemId: item.id, itemType })
            });
            
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Error HTTP al enviar los correos.");
            }
            alert("¡Notificación enviada con éxito a los suscriptores!");
        } catch (error) {
            console.error("Error al notificar:", error);
            alert("Ocurrió un error: " + error.message);
        }
    };

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
                        {isOrderDirty && (
                            <button
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-sm shadow-sm"
                                onClick={async () => {
                                    const ok = await persistRows(rows, "manual save order");
                                    if (ok) {
                                        setIsOrderDirty(false);
                                        loadResearch();
                                    } else {
                                        alert("Error al guardar el nuevo orden.");
                                    }
                                }}
                            >
                                Guardar nuevo orden
                            </button>
                        )}
                        <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e83d38] hover:bg-red-700 text-white text-sm">
                            <Plus className="w-4 h-4" /> Nuevo Artículo
                        </button>
                    </div>
                </div>
            </div>

            <ResearchTable
                isDragEnabled={searchTerm === "" && statusFilter === "all"}
                research={[...filteredArticles].sort((a, b) => {
                    if (!!a.archived && !b.archived) return 1;
                    if (!a.archived && !!b.archived) return -1;
                    const ao = typeof a.order === "number" ? a.order : 999;
                    const bo = typeof b.order === "number" ? b.order : 999;
                    return ao - bo;
                })}
                onReorder={(newOrderedRows) => {
                    setRows(newOrderedRows);
                    setIsOrderDirty(true);
                }}
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
                onNotify={(row) => {
                    setNotifyRow(row);
                    setShowNotifyConfirm(true);
                }}
                onDelete={async (article) => {
                    if (window.confirm(`¿Seguro que deseas eliminar permanentemente el artículo "${article.title?.es || article.title?.en || article.title || article.id}"?\n\nEsta acción no se puede deshacer y el artículo dejará de aparecer en la web.`)) {
                        try {
                            // 1. Borrar documento de Firestore
                            const { doc, deleteDoc } = await import("firebase/firestore");
                            const { db } = await import("../../../config/firebase");

                            await deleteDoc(doc(db, "research", article.id));

                            // 2. Borrar archivos de Supabase (silencioso sin bloquear UI)
                            const filesToDelete = [];
                            if (article.localImage) filesToDelete.push(article.localImage);
                            if (article.download_link_pdf) filesToDelete.push(article.download_link_pdf);

                            Promise.allSettled(
                                filesToDelete.map(url => deleteFileFromSupabase(url))
                            ).catch(e => console.error("Error eliminando archivos de investigación en Supabase:", e));

                            // 3. Actualizar estado y auto-persist
                            const nextRows = rows.filter(r => r.id !== article.id);
                            const normalized = normalizeOrder(nextRows);
                            setRows(normalized);
                            await persistRows(normalized, "auto-save: after delete research");

                            loadResearch();
                        } catch (error) {
                            console.error("Error deleting research item:", error);
                            alert("Hubo un error al eliminar el artículo.");
                        }
                    }
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



            <NotifyConfirmModal
                open={showNotifyConfirm}
                item={notifyRow}
                itemType="research"
                onClose={() => setShowNotifyConfirm(false)}
                onConfirm={handleNotifyLaunch}
            />
        </div>
    );
}
