import { NextRequest, NextResponse } from "next/server";
import { createDemoAdminSession, DEMO_ADMIN_COOKIE } from "../../lib/demoAuth";

function isDemoLoginEnabled(): boolean {
    return process.env.NODE_ENV === "development";
}

function notFound(): NextResponse {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isDemoLoginEnabled()) {
        return notFound();
    }

    const login = process.env.DEMO_ADMIN_LOGIN;
    const email = process.env.DEMO_ADMIN_EMAIL;
    const password = process.env.DEMO_ADMIN_PASSWORD;
    const secret = process.env.DEMO_ADMIN_SESSION_SECRET;

    if (!login || !email || !password || !secret || secret.length < 32) {
        return NextResponse.json({ error: "Demo admin is not configured." }, { status: 503 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (
        typeof body !== "object" ||
        body === null ||
        !("login" in body) ||
        !("password" in body) ||
        typeof body.login !== "string" ||
        typeof body.password !== "string"
    ) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const isKnownLogin =
        body.login.trim().toLowerCase() === login.toLowerCase() ||
        body.login.trim().toLowerCase() === email.toLowerCase();

    if (!isKnownLogin || body.password !== password) {
        return NextResponse.json({ error: "Invalid login or password." }, { status: 401 });
    }

    const remember = "remember" in body && body.remember === true;
    const lifetimeSeconds = remember ? 24 * 60 * 60 : 8 * 60 * 60;
    const expiresAt = Date.now() + lifetimeSeconds * 1000;
    const session = await createDemoAdminSession(expiresAt, secret);
    const response = NextResponse.json({
        user: {
            id: 0,
            login,
            email,
            first_name: "",
            last_name: "",
        },
    });

    response.cookies.set(DEMO_ADMIN_COOKIE, session, {
        httpOnly: true,
        sameSite: "strict",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        ...(remember ? { maxAge: lifetimeSeconds } : {}),
    });

    return response;
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    if (!isDemoLoginEnabled()) {
        return notFound();
    }

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(DEMO_ADMIN_COOKIE, "", {
        httpOnly: true,
        sameSite: "strict",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 0,
    });
    return response;
}
