/**
 * Wrapper for fetch that handles JSON parsing and error checking.
 */
export async function fetchJson(url, options = {}) {
    const opts = {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        // Always send cookies for auth-protected dev API and avoid stale caches
        credentials: "include",
        cache: "no-store",
        ...options,
    };
    const res = await fetch(url, opts);
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // non-JSON response
    }
    if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`;
        console.warn("fetchJson error", { url, status: res.status, body: text });
        const err = new Error(msg || "request_failed");
        err.__raw = text;
        err.__status = res.status;
        throw err;
    }
    return data;
}
