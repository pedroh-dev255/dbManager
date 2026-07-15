// app/api/server/route.js
import { NextResponse } from "next/server";
import { proxy } from "../../../_proxy";

export async function POST(request) {
  try {
    const body = await request.json();
    const { serverId, database } = body;

    const token = request.cookies.get('token')?.value;
    const res = await proxy(request, `${process.env.BACKEND_URL}/db/listDbData`,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({serverId, database}),
            cache: 'no-store',
        }
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao conectar ao servidor" },
      { status: 500 }
    );
  }
}