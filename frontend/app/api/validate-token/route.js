// app/api/validate-token/route.js (App Router)
import { NextResponse } from 'next/server';
import { proxy } from "../_proxy";

export async function GET(request) {

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") || "unknown";

  try {
    const token = request.cookies.get('token')?.value;
    if (!token){
      return NextResponse.json({ success: false }, { status: 401 });
    }
    console.log(`${process.env.BACKEND_URL}/validate`);
    // chamar sua API real ou validação local aqui
    // por exemplo:
    const res = await proxy(request, `${process.env.BACKEND_URL}/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        "x-client-ip": ip
      },
      cache: 'no-store',
    });

    const data = await res.json();
    //if (!res.ok) return NextResponse.json({ success: false }, { status: 401 });
    console.log(data)
    return NextResponse.json({ success: !!data.success });
  } catch (err) {
    console.error('API validate-token error', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}