// app/api/login/route.js
import { NextResponse } from "next/server";
import { proxy } from "../_proxy";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const res = await proxy(
      request,
      `${process.env.BACKEND_URL}/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();
    
    if (!res.ok || !data.userData?.token) {
      return NextResponse.json(
        { success: false, message: data.message || "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("token", data.userData.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    response.cookies.set(
      "userData",
      JSON.stringify({
          id: data.userData.id,
          name: data.userData.nome
      }),
      {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
      }
  );

    return response;
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao conectar ao servidor" },
      { status: 500 }
    );
  }
}