//api/route.js
import { NextResponse } from "next/server";
import { proxy } from "./_proxy";

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value;
        const res = await proxy(request, `${process.env.API_URL}/api/data/dashboard`,
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                cache: 'no-store',
            }
        );
        if(res.status === 403) {
            return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
        }
        
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ success: false, message: 'Erro ao carregar dados' }, { status: 500 });
    }
}