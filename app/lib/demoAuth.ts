export const DEMO_ADMIN_COOKIE = "demo_admin";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): ArrayBuffer {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
    );
}

export async function createDemoAdminSession(expiresAt: number, secret: string): Promise<string> {
    const payload = String(expiresAt);
    const signature = await crypto.subtle.sign("HMAC", await getHmacKey(secret), encoder.encode(payload));
    return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyDemoAdminSession(
    session: string | undefined,
    secret: string | undefined,
): Promise<boolean> {
    if (!session || !secret || secret.length < 32) {
        return false;
    }

    const [payload, signature, extra] = session.split(".");
    if (
        extra !== undefined ||
        !/^\d{10,13}$/.test(payload ?? "") ||
        !/^[A-Za-z0-9_-]{43}$/.test(signature ?? "") ||
        Number(payload) <= Date.now()
    ) {
        return false;
    }

    try {
        return await crypto.subtle.verify(
            "HMAC",
            await getHmacKey(secret),
            fromBase64Url(signature),
            encoder.encode(payload),
        );
    } catch {
        return false;
    }
}
