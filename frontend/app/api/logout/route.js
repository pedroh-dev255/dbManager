import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    
    const response = NextResponse.json({ success: true, message: "Logout realizado com sucesso" });

    response.cookies.set('token', '', {
      httpOnly: false,
      expires: new Date(0), // expira o cookie imediatamente
      path: '/',
    });
    response.cookies.set('userData', '', {
      httpOnly: false,
      expires: new Date(0), // expira o cookie imediatamente
      path: '/',
    });

    return response;
  } catch (err) {
    console.error("Erro no logout:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao conectar ao servidor" },
      { status: 500 }
    );
  }
}