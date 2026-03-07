import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ProductsTable from "../components/products/ProductsTable";
import ProductFormModal from "../components/products/ProductFormModal";
import ProductArchiveConfirmModal from "../components/products/ProductArchiveConfirmModal";
import { fetchJson } from "../../../lib/api";
import { normalizeOrder } from "../../../lib/crud";
import { useProducts } from "../../../context/hooks/useProducts";

// Helper to migrate legacy products to new flat schema with suffixes (Option 1)
function migrateProduct(product) {
    const migrated = { ...product };
    // Flatten names
    if (typeof migrated.name === "object") {
        migrated.name_es = migrated.name.es || "";
        migrated.name_en = migrated.name.en || "";
        delete migrated.name;
    }
    // Flatten descriptions
    const oldDesc = migrated.descriptionDetail || migrated.description;
    if (typeof oldDesc === "object") {
        migrated.description_es = oldDesc.es || "";
        migrated.description_en = oldDesc.en || "";
    } else if (typeof migrated.description === "string") {
        migrated.description_es = migrated.description;
        migrated.description_en = "";
    }
    delete migrated.description;
    delete migrated.descriptionDetail;

    // Transform category/features to tag
    if (typeof migrated.category === "object") {
        migrated.tag_es = migrated.category.es || "";
        migrated.tag_en = migrated.category.en || "";
    } else if (typeof migrated.category === "string") {
        migrated.tag_es = migrated.category;
        migrated.tag_en = "";
    }
    delete migrated.category;
    delete migrated.features;
    delete migrated.featuresDetail;

    // Technical Sheets
    if (typeof migrated.technicalSheets === "object") {
        migrated.technical_sheet_es = migrated.technicalSheets.es || "";
        migrated.technical_sheet_en = migrated.technicalSheets.en || "";
    }
    delete migrated.technicalSheets;

    // Capabilities
    if (typeof migrated.capabilities === "object" && !Array.isArray(migrated.capabilities)) {
        migrated.capabilities_es = migrated.capabilities.es || [];
        migrated.capabilities_en = migrated.capabilities.en || [];
    } else if (Array.isArray(migrated.capabilities)) {
        migrated.capabilities_es = migrated.capabilities;
        migrated.capabilities_en = migrated.capabilities;
    }
    delete migrated.capabilities;

    // Photos and Video
    migrated.photos = migrated.photos || migrated.image || "";
    migrated.video = migrated.video || migrated.youtubeVideo || "";
    delete migrated.image;
    delete migrated.additionalImages;
    delete migrated.youtubeVideo;
    delete migrated.specifications;
    delete migrated.tagline;

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

    async function loadProducts() {
        try {
            const { collection, getDocs } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");
            const querySnapshot = await getDocs(collection(db, "products"));
            let data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            data = data.map(migrateProduct);
            setRows(normalizeOrder(data));
        } catch (error) {
            console.error("Error cargando productos de Firestore:", error);
            setRows([]);
        }
    }

    async function persistRows(nextRows, reason = "auto-save") {
        try {
            const { doc, writeBatch } = await import("firebase/firestore");
            const { db } = await import("../../../config/firebase");

            const batch = writeBatch(db);
            nextRows.forEach((item) => {
                const itemRef = doc(db, "products", item.id);
                // Asegurarnos de limpiar cualquier key antigua antes de guardar
                const cleanedItem = migrateProduct(item);
                batch.set(itemRef, cleanedItem, { merge: true }); // merge: true preserves other unexpected fields, but we overwrite known bad ones with cleanedItem in future writes
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.warn("Auto-persist products failed in Firestore:", e?.message || e);
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
                            name_es: "",
                            name_en: "",
                            description_es: "",
                            description_en: "",
                            photos: "",
                            video: "",
                            technical_sheet_es: "",
                            technical_sheet_en: "",
                            tag_es: "",
                            tag_en: "",
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
                onOrderChange={async (product, newOrder) => {
                    const prev = rows;
                    const others = prev.filter((r) => r.id !== product.id);
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
                        { ...product, order: target },
                    ];
                    const nextComputed = normalizeOrder(next);
                    setRows(nextComputed);
                    const ok = await persistRows(nextComputed, "auto-save: onOrderChange");
                    if (!ok) alert("No se pudo guardar el nuevo orden.");
                    else loadProducts();
                }}
                onDelete={async (product) => {
                    if (window.confirm(`¿Seguro que deseas eliminar permanentemente el producto "${product.name_es || product.name?.es || product.id}"?\n\nEsta acción no se puede deshacer.`)) {
                        try {
                            const { doc, deleteDoc } = await import("firebase/firestore");
                            const { db } = await import("../../../config/firebase");

                            await deleteDoc(doc(db, "products", product.id));

                            const nextRows = rows.filter(r => r.id !== product.id);
                            const normalized = normalizeOrder(nextRows);
                            setRows(normalized);
                            await persistRows(normalized, "auto-save: after delete");

                            loadProducts();
                            refreshProducts();
                        } catch (e) {
                            alert("Error al eliminar el producto: " + (e?.message || e));
                        }
                    }
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
