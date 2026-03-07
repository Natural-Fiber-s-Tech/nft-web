import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fetchJson } from "../../../lib/api";
import { normalizeTeamMember, normalizeTeamOrder } from "../../../models/team";
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

    useEffect(() => {
        loadTeam();
    }, []);

    async function loadTeam() {
        try {
            const { collection, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const querySnapshot = await getDocs(collection(db, "team"));

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Firestore devuelve el objeto, lo normalizamos
                setRows(normalizeTeamOrder(data.map(normalizeTeamMember)));
            } else {
                const r = await fetch("/content/team.json");
                if (r.ok) {
                    const raw = await r.json();
                    const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
                    if (data.length) {
                        const normalized = normalizeTeamOrder(data.map(normalizeTeamMember));
                        setRows(normalized);
                        await persistRows(normalized, "seed team from public content");
                    }
                } else {
                    setRows([]);
                }
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

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
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

            <TeamTable
                team={tableRows}
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
