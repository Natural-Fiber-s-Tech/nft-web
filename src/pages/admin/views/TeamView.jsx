import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fetchJson } from "../../../lib/api";
import { normalizeTeamMember, normalizeTeamOrder } from "../../../models/team";
import { deleteFileFromSupabase, uploadFileToSupabase, compressImageToWebP } from "../../../lib/storage";
import TeamTable from "../components/team/TeamTable";
import TeamFormModal from "../components/team/TeamFormModal";
import TeamArchiveConfirmModal from "../components/team/TeamArchiveConfirmModal";

export default function TeamView() {
    const [rows, setRows] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState("view");
    const [confirmRow, setConfirmRow] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadTeam();
    }, []);

    async function loadTeam(forceRefresh = false) {
        try {
            if (forceRefresh) {
                sessionStorage.removeItem("nft_team_cache");
                sessionStorage.removeItem("nft_team_cache_time");
            } else {
                const cached = sessionStorage.getItem("nft_team_cache");
                const cacheTime = sessionStorage.getItem("nft_team_cache_time");
                if (cached && cacheTime) {
                    const MathAge = Date.now() - parseInt(cacheTime, 10);
                    if (MathAge < 86400000) {
                        console.log("⚡ Team loaded from Session Storage");
                        setRows(JSON.parse(cached));
                        return;
                    }
                }
            }
            const { collection, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const querySnapshot = await getDocs(collection(db, "team"));

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Firestore devuelve el objeto, lo normalizamos
                const finalRows = normalizeTeamOrder(data.map(normalizeTeamMember));
                
                sessionStorage.setItem("nft_team_cache", JSON.stringify(finalRows));
                sessionStorage.setItem("nft_team_cache_time", Date.now().toString());
                
                setRows(finalRows);
            } else {
                setRows([]);
            }
        } catch (error) {
            console.error("Error cargando equipo desde Firestore:", error);
            setRows([]);
        }
    }

    async function persistRows(nextRows, reason = "auto-save") {
        try {
            const { doc, writeBatch } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const batch = writeBatch(db);
            nextRows.forEach((item) => {
                const itemRef = doc(db, "team", item.id);
                batch.set(itemRef, item, { merge: true });
            });
            await batch.commit();
            
            // Clear cache after persisting
            sessionStorage.removeItem("nft_team_cache");
            sessionStorage.removeItem("nft_team_cache_time");
            
            return true;
        } catch (e) {
            console.warn("Auto-persist team failed in Firestore:", e);
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

    // Filtrar localmente
    const filteredTeam = tableRows.filter(member => {
        const matchesSearch = searchTerm === "" ||
            (member.name?.es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.name?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof member.name === 'string' && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                member.role?.es?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.role?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof member.role === 'string' && member.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                member.id?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && !member.archived) ||
            (statusFilter === "archived" && member.archived);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Equipo</h2>
                    <p className="text-muted-foreground">
                        Gestiona los miembros del equipo y sus perfiles.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cargo o ID..."
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e83d38] hover:bg-red-700 text-white transition-colors text-sm"
                            onClick={() => {
                                const blank = {
                                    id: "team-" + Math.random().toString(36).slice(2, 8),
                                    name: "",
                                    role: "",
                                    photo: "",
                                    skills: [],
                                    order: (rows?.filter((x) => !x.archived).length || 0) + 1,
                                    archived: false,
                                };
                                setEditing(blank);
                                setModalMode("create");
                                setShowForm(true);
                            }}
                        >
                            <Plus className="w-4 h-4" /> Nuevo Miembro
                        </button>
                    </div>
                </div>
            </div>

            <TeamTable
                team={filteredTeam}
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
                    setConfirmRow(row);
                    setShowConfirm(true);
                }}
                onOrderChange={async (member, newOrder) => {
                    const prev = rows;
                    const others = prev.filter((r) => r.id !== member.id);
                    const compact = normalizeTeamOrder(others);
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
                        { ...member, order: target },
                    ];
                    const nextComputed = normalizeTeamOrder(next);
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: onOrderChange");
                    if (!ok) alert("No se pudo guardar el nuevo orden.");
                    else loadTeam();
                }}
                onDelete={async (member) => {
                    if (window.confirm(`¿Seguro que deseas eliminar permanentemente a "${member.name?.es || member.name || member.id}"?\n\nEsta acción no se puede deshacer.`)) {
                        try {
                            const { doc, deleteDoc } = await import("firebase/firestore");
                            const { db } = await import("../../../config/firebase");

                            await deleteDoc(doc(db, "team", member.id));

                            const filesToDelete = [];
                            if (member.photo) filesToDelete.push(member.photo);
                            if (member.image) filesToDelete.push(member.image);
                            if (member.src_cv_pdf) filesToDelete.push(member.src_cv_pdf);

                            Promise.allSettled(
                                filesToDelete.map(url => deleteFileFromSupabase(url))
                            ).catch(e => console.error("Error eliminando archivos de equipo en Supabase:", e));

                            const nextRows = rows.filter(r => r.id !== member.id);
                            const normalized = normalizeTeamOrder(nextRows);
                            setRows(normalized);
                            await persistRows(normalized, "auto-save: after delete");

                            loadTeam();
                        } catch (e) {
                            alert("Error al eliminar al miembro: " + (e?.message || e));
                        }
                    }
                }}
            />

            <TeamFormModal
                open={showForm}
                mode={modalMode}
                member={editing}
                onClose={() => setShowForm(false)}
                onSave={async (payload) => {
                    let nextComputed = [];
                    const prev = rows;
                    const others = prev.filter((r) => r.id !== payload.id);
                    const compact = normalizeTeamOrder(others);
                    if (payload.archived) {
                        nextComputed = normalizeTeamOrder([...compact, payload]);
                    } else {
                        const active = compact.filter((x) => !x.archived);
                        const activeCount = active.length;
                        const req = Number(payload.order) || activeCount + 1;
                        const target = Math.max(1, Math.min(req, activeCount + 1));
                        const shifted = compact.map((r) => {
                            if (!r.archived && Number(r.order) >= target)
                                return { ...r, order: Number(r.order) + 1 };
                            return r;
                        });
                        const next = [
                            ...shifted,
                            { ...payload, archived: false, order: target },
                        ];
                        nextComputed = normalizeTeamOrder(next);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: onSave team");
                    if (!ok) alert("Error saving team member");
                    else loadTeam();
                    setShowForm(false);
                }}
                onRestore={async (toRestore) => {
                    if (!toRestore) return;
                    const prev = rows;
                    const compact = normalizeTeamOrder(prev);
                    const active = compact.filter((x) => !x.archived);
                    const max = Math.max(0, ...active.map((x) => Number(x.order) || 0));
                    const req = Math.max(1, Math.min(Number(toRestore.order) || max + 1, max + 1));
                    const shifted = compact.map((r) => {
                        if (!r.archived && Number(r.order) >= req)
                            return { ...r, order: Number(r.order) + 1 };
                        return r;
                    });
                    const next = shifted.map((r) =>
                        r.id === toRestore.id ? { ...r, archived: false, order: req } : r
                    );
                    const nextComputed = normalizeTeamOrder(next);
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: restore team");
                    if (!ok) alert("Error restoring team member");
                    else loadTeam();
                    setShowForm(false);
                }}
            />

            <TeamArchiveConfirmModal
                open={showConfirm}
                member={confirmRow}
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
                        nextComputed = normalizeTeamOrder(mapped);
                    } else {
                        const compact = normalizeTeamOrder(rows);
                        const active = compact.filter((x) => !x.archived);
                        const max = Math.max(0, ...active.map((x) => Number(x.order) || 0));
                        const target = typeof restoreAt === "number" ? Math.max(1, Math.min(restoreAt, max + 1)) : max + 1;
                        const shifted = compact.map((r) => {
                            if (!r.archived && Number(r.order) >= target)
                                return { ...r, order: Number(r.order) + 1 };
                            return r;
                        });
                        const next = shifted.map((r) =>
                            r.id === confirmRow.id
                                ? { ...r, archived: false, order: target }
                                : r
                        );
                        nextComputed = normalizeTeamOrder(next);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, willArchive ? "archive" : "restore");
                    if (!ok) alert("Error persisting team change");
                    else loadTeam();
                    setShowConfirm(false);
                }}
            />
        </div>
    );
}
