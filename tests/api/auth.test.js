import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import authHandler from "../../api/auth";
import * as authLib from "../../api/_lib/auth";

// Mock environment variables
const originalEnv = process.env;

describe("API: Auth Handler", () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = {
            ...originalEnv,
            ADMIN_USERNAME: "admin",
            ADMIN_PASSWORD: "password",
            JWT_SECRET: "secret"
        };
        // Mock internal auth lib functions
        vi.spyOn(authLib, "signToken").mockReturnValue("mock-token");
        vi.spyOn(authLib, "setAuthCookie").mockImplementation(() => { });
        vi.spyOn(authLib, "clearAuthCookie").mockImplementation(() => { });
        vi.spyOn(authLib, "verifyTokenFromCookie").mockReturnValue(null);
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    const createMockReqRes = ({ method = "GET", url = "/api/auth", body = null, headers = {} }) => {
        let responseData = "";
        let statusCode = 200;
        const resHeaders = {};

        const req = {
            method,
            url,
            headers,
            [Symbol.asyncIterator]: async function* () {
                if (body) {
                    yield Buffer.from(JSON.stringify(body));
                }
            }
        };

        const res = {
            setHeader: (k, v) => { resHeaders[k.toLowerCase()] = v },
            end: (data) => { responseData = data; },
            get statusCode() { return statusCode; },
            set statusCode(v) { statusCode = v; }
        };

        return { req, res, getResponse: () => JSON.parse(responseData || "{}") };
    };

    it("should fail login with invalid credentials", async () => {
        const { req, res, getResponse } = createMockReqRes({
            method: "POST",
            body: { action: "login", username: "admin", password: "wrong-password" }
        });

        await authHandler(req, res);

        expect(res.statusCode).toBe(401);
        expect(getResponse()).toEqual({ ok: false, error: "invalid_credentials" });
    });

    it("should succeed login with valid credentials", async () => {
        const { req, res, getResponse } = createMockReqRes({
            method: "POST",
            body: { action: "login", username: "admin", password: "password" }
        });

        await authHandler(req, res);

        expect(res.statusCode).toBe(200);
        expect(getResponse()).toEqual({ ok: true });
        expect(authLib.signToken).toHaveBeenCalledWith({ u: "admin" });
        expect(authLib.setAuthCookie).toHaveBeenCalled();
    });

    it("should handle logout action", async () => {
        const { req, res, getResponse } = createMockReqRes({
            method: "POST",
            body: { action: "logout" }
        });

        await authHandler(req, res);

        expect(res.statusCode).toBe(200);
        expect(getResponse()).toEqual({ ok: true });
        expect(authLib.clearAuthCookie).toHaveBeenCalled();
    });

    it("should return unauthenticated for 'me' without cookie", async () => {
        const { req, res, getResponse } = createMockReqRes({
            method: "GET",
            url: "/api/auth?action=me"
        });

        await authHandler(req, res);

        expect(res.statusCode).toBe(200);
        expect(getResponse()).toEqual({ authenticated: false });
    });

    it("should return authenticated user for 'me' with valid cookie", async () => {
        authLib.verifyTokenFromCookie.mockReturnValue({ u: "admin" });

        const { req, res, getResponse } = createMockReqRes({
            method: "GET",
            url: "/api/auth?action=me"
        });

        await authHandler(req, res);

        expect(res.statusCode).toBe(200);
        expect(getResponse()).toEqual({ authenticated: true, user: { name: "admin" } });
    });
});
