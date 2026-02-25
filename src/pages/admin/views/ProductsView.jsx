import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ProductsTable from "../components/products/ProductsTable";
import ProductFormModal from "../components/products/ProductFormModal";
import ProductArchiveConfirmModal from "../components/products/ProductArchiveConfirmModal";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder } from "../../../lib/crud";
import { useProducts } from "../../../context/hooks/useProducts";

// Helper to migrate legacy producst
function migrateProduct(product) {
    const migrated = { ...product };
    if (typeof migrated.category === "string") {
        migrated.category = { es: migrated.category, en: "" };
    }
    if (Array.isArray(migrated.features)) {
        migrated.features = { es: migrated.features, en: [] };
    }
    if (
        migrated.specifications &&
        typeof migrated.specifications === "object" &&
        !migrated.specifications.es &&
        !migrated.specifications.en
    ) {
        migrated.specifications = { es: migrated.specifications, en: {} };
    }
    if (Array.isArray(migrated.capabilities)) {
        migrated.capabilities = { es: migrated.capabilities, en: [] };
    }
    return migrated;
}

export default function ProductsView() {
    const [rows, setRows] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modalMode, setModalMode] = useState("view");
    const [confirmRow, setConfirmRow] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const { refreshProducts } = useProducts();

    useEffect(() => {
        loadProducts();
    }, []);

    function loadProducts() {
        fetchJson("/api/products/list")
            .then((d) => {
                if (d.ok) {
                    let data = Array.isArray(d.data) ? d.data : [];
                    data = data.map(migrateProduct);
                    setRows(normalizeOrder(data));
                }
            })
            .catch(() => {
                fetchJson("/content/products.json")
                    .then((d) => {
                        const data = Array.isArray(d)
                            ? d
                            : Array.isArray(d?.data)
                                ? d.data
                                : [];
                        const migrated = data.map(migrateProduct);
                        setRows(normalizeOrder(migrated));
                    })
                    .catch(() => setRows([]));
            });
    }

    async function persistRows(nextRows, reason = "auto-save") {
        try {
            // Local cache
            try {
                localStorage.setItem("admin_products", JSON.stringify(nextRows));
            } catch { }

            await fetchJson("/api/products/save", {
                method: "POST",
                body: JSON.stringify({
                    data: nextRows,
                    message: reason,
                }),
            });
            return true;
        } catch (e) {
            console.warn("Auto-persist products failed:", e?.message || e);
            return false;
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => {
                        const blank = {
                            id: "product-" + Math.random().toString(36).slice(2, 8),
                            name: { es: "", en: "" },
                            tagline: { es: "", en: "" },
                            description: { es: "", en: "" },
                            descriptionDetail: { es: "", en: "" },
                            image: "",
                            category: "",
                            technicalSheets: { es: "", en: "" },
                            features: { es: [""], en: [""] },
                            featuresDetail: [],
                            specifications: {},
                            capabilities: [],
                            youtubeVideo: "",
                            additionalImages: [],
                            order: (rows?.filter((x) => !x.archived).length || 0) + 1,
                            archived: false,
                        };
                        setEditing(blank);
                        setModalMode("create");
                        setShowForm(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    title="Restaurar productos desde respaldo"
                    onClick={async () => {
                        // Logic simplified for brevity, assume similar to AdminApp
                        try {
                            const b = await fetchJson("/api/products/backups");
                            const files = Array.isArray(b?.files) ? b.files : [];
                            if (files.length) {
                                const latest = files[0];
                                const r = await fetchJson(
                                    `/api/products/restore?file=${encodeURIComponent(latest)}`,
                                    { method: "POST" }
                                );
                                if (r?.ok) {
                                    loadProducts();
                                    alert("Productos restaurados desde respaldo: " + latest);
                                    return;
                                }
                            }
                            const cached = localStorage.getItem("admin_products");
                            if (cached) {
                                const data = JSON.parse(cached);
                                if (Array.isArray(data) && data.length) {
                                    setRows(data);
                                    await persistRows(data, "restore from local cache");
                                    alert("Productos restaurados desde caché local");
                                    return;
                                }
                            }
                            alert("No se encontraron respaldos disponibles");
                        } catch (e) {
                            alert("Error restaurando: " + (e?.message || e));
                        }
                    }}
                >
                    Restaurar
                </button>
            </div>

            <ProductsTable
                products={[...rows].sort((a, b) => {
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
                    setConfirmRow(row);
                    setShowConfirm(true);
                }}
            />

            <ProductFormModal
                open={showForm}
                mode={modalMode}
                product={editing}
                onClose={() => setShowForm(false)}
                onSave={async (payload) => {
                    // Logic from AdminApp
                    let nextComputed = [];
                    const prev = rows;
                    const others = prev.filter((r) => r.id !== payload.id);
                    const compact = normalizeOrder(others);
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
                        const next = [
                            ...shifted,
                            { ...payload, archived: false, order: target },
                        ];
                        nextComputed = normalizeOrder(next);
                    }
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: onSave product");
                    if (!ok) alert("No se pudo guardar.");
                    else {
                        loadProducts();
                        refreshProducts();
                    }
                    setShowForm(false);
                }}
                onRestore={async (toRestore) => {
                    // Logic from AdminApp
                    if (!toRestore) return;
                    const prev = rows;
                    const compact = normalizeOrder(prev);
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
                    const ok = await persistRows(nextComputed, "auto-save: restore product");
                    if (!ok) alert("No se pudo restaurar.");
                    else {
                        loadProducts();
                        refreshProducts();
                    }
                    setShowForm(false);
                }}
            />

            <ProductArchiveConfirmModal
                open={showConfirm}
                product={confirmRow}
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
                    else {
                        loadProducts();
                        refreshProducts();
                    }
                    setShowConfirm(false);
                }}
            />
        </div>
    );
}
