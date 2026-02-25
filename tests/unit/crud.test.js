import { describe, it, expect } from "vitest";
import { normalizeOrder, upsertWithReorder } from "../../src/lib/crud";

describe("CRUD Helpers: Order Management", () => {
    it("should normalize order correctly", () => {
        const input = [
            { id: 1, order: 3, archived: false },
            { id: 2, order: 1, archived: false },
            { id: 3, order: 2, archived: true },
        ];
        // actives: id=2 (ord 1), id=1 (ord 3 -> normalized 2)
        // archived: id=3 (stays same)

        // actives sorted by order: id=2, id=1
        // re-indexed: id=2 -> order 1, id=1 -> order 2

        const result = normalizeOrder(input);
        const id2 = result.find(i => i.id === 2);
        const id1 = result.find(i => i.id === 1);
        const id3 = result.find(i => i.id === 3);

        expect(id2.order).toBe(1);
        expect(id1.order).toBe(2);
        expect(id3.archived).toBe(true);
    });

    it("should reorder items correctly when moving up", () => {
        // [A(1), B(2), C(3)] -> Move C to 1 -> [C(1), A(2), B(3)]
        const list = [
            { id: "A", order: 1, archived: false },
            { id: "B", order: 2, archived: false },
            { id: "C", order: 3, archived: false },
        ];
        const newItem = { id: "C", order: 1, archived: false };

        const result = upsertWithReorder(list, newItem);
        const sorted = result.sort((a, b) => a.order - b.order);

        expect(sorted[0].id).toBe("C");
        expect(sorted[0].order).toBe(1);
        expect(sorted[1].id).toBe("A");
        expect(sorted[1].order).toBe(2);
        expect(sorted[2].id).toBe("B");
        expect(sorted[2].order).toBe(3);
    });

    it("should reorder items correctly when moving down", () => {
        // [A(1), B(2), C(3)] -> Move A to 3 -> [B(1), C(2), A(3)]
        const list = [
            { id: "A", order: 1, archived: false },
            { id: "B", order: 2, archived: false },
            { id: "C", order: 3, archived: false },
        ];
        const newItem = { id: "A", order: 3, archived: false };

        const result = upsertWithReorder(list, newItem);
        const sorted = result.sort((a, b) => a.order - b.order);

        expect(sorted[0].id).toBe("B");
        expect(sorted[0].order).toBe(1);
        expect(sorted[1].id).toBe("C");
        expect(sorted[1].order).toBe(2);
        expect(sorted[2].id).toBe("A");
        expect(sorted[2].order).toBe(3);
    });

    it("should handle insertion of new item", () => {
        // [A(1), B(2)] -> Insert C at 2 -> [A(1), C(2), B(3)]
        const list = [
            { id: "A", order: 1, archived: false },
            { id: "B", order: 2, archived: false },
        ];
        const newItem = { id: "C", order: 2, archived: false }; // New ID

        const result = upsertWithReorder(list, newItem);
        const sorted = result.sort((a, b) => a.order - b.order);

        expect(sorted[0].id).toBe("A");
        expect(sorted[1].id).toBe("C");
        expect(sorted[2].id).toBe("B");
    });
});
