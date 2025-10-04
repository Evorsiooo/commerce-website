import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import type { Database } from "@/db/types/supabase";
import { env } from "@/lib/env";
import { AUTH0_PKCE_COOKIE } from "@/lib/auth/auth0";
import { AUTH0_SESSION_COOKIE_CLEAR } from "@/lib/auth/session";

function resolveRedirect(requestUrl: URL) {
	const redirect = requestUrl.searchParams.get("redirect");

	if (!redirect) {
		return new URL("/", requestUrl.origin);
	}

	try {
		const parsed = new URL(redirect, requestUrl.origin);
		if (parsed.origin === requestUrl.origin) {
			return parsed;
		}
	} catch (error) {
		console.warn("Invalid logout redirect", { redirect, error });
	}

	return new URL("/", requestUrl.origin);
}

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);

	const supabase = createRouteHandlerClient<Database>({ cookies }, {
		supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
		supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	});

	const { error } = await supabase.auth.signOut();

	if (error) {
		console.error("Supabase sign-out failed", error);
	}

	const response = NextResponse.redirect(resolveRedirect(requestUrl));

	response.cookies.set(AUTH0_SESSION_COOKIE_CLEAR);
	response.cookies.set({
		name: AUTH0_PKCE_COOKIE,
		value: "",
		maxAge: 0,
		path: "/",
	});

	response.headers.set("Cache-Control", "no-store");

	return response;
}
