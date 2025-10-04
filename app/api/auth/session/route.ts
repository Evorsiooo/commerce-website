import { NextResponse } from "next/server";

import { getAuth0SessionFromCookies } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
	return {
		"Cache-Control": "no-store, max-age=0",
		"Pragma": "no-cache",
	};
}

export async function GET() {
	const session = await getAuth0SessionFromCookies();

	if (!session) {
		return NextResponse.json(
			{ authenticated: false },
			{ status: 401, headers: noStoreHeaders() },
		);
	}

	const { expiresAt, provider, connection, scope, tokenType } = session;

	return NextResponse.json(
		{
			authenticated: true,
			session: {
				expiresAt,
				provider,
				connection,
				scope,
				tokenType,
			},
		},
		{ headers: noStoreHeaders() },
	);
}

export async function HEAD() {
	const session = await getAuth0SessionFromCookies();
	const status = session ? 200 : 401;
	return new NextResponse(null, { status, headers: noStoreHeaders() });
}
