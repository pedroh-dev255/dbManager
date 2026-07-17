// app/api/server/add/route.js
import { NextResponse } from "next/server";
import { proxy } from "../../_proxy";

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();
    
    const res = await proxy(request, `${process.env.BACKEND_URL}/conn/create`,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              nome: body.nome,
              descricao: body.descricao,
              host: body.host,
              porta: body.porta,
              usuario: body.usuario,
              senha: body.senha,
              tipo: body.tipo,
              ssl_active: body.ssl_active,
              ativo: body.ativo
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