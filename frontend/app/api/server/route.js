// app/api/server/route.js
import { NextResponse } from "next/server";
import { proxy } from "../_proxy";

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const res = await proxy(request, `${process.env.BACKEND_URL}/conn/list`,
        {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        }
    );

    const data = await res.json();

    if(data.success === false) {
        return NextResponse.json({ success: false, message: 'Erro ao consultar dados' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao conectar ao servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();
    const {host, port,user,pass} = body

    const res = await proxy(request, `${process.env.BACKEND_URL}/conn/connTest`,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              host,
              porta: port,
              usuario: user,
              senha: pass
            }),
            cache: 'no-store',
        }
    );

    const data = await res.json();

    if(data.success === false) {
        return NextResponse.json({ success: false, message: data.message}, { status: 400 });
    }

    return NextResponse.json(data);

  }catch(error){
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao conectar ao servidor" },
      { status: 500 }
    );
  }
}