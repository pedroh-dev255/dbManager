"use client";

import { useState } from "react";
import {
    Database,
    Lock,
    User,
    Eye,
    EyeOff,
    ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { usePathname, useRouter } from 'next/navigation';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();

        setLoading(true);
        try {
            if(!email?.trim() || !password?.trim()){
                toast.error("Email ou Senha não podem ser vazios!");
            }
            
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                }),
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(
                data.message ||
                'Usuário ou senha inválidos'
                );
                return;
            }
            toast.success(
                'Login realizado com sucesso!'
            );
            router.push('/');
        } catch (error) {
            toast.error(error.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/icon-512.png" className="h-20" />

                    <h1 className="text-3xl font-bold text-slate-800 mt-5">
                        dbManager
                    </h1>
                    <p className="text-slate-500 mt-2 text-center">
                        Gerenciamento de servidores MySQL e MariaDB
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <form
                        onSubmit={handleLogin}
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Usuário
                            </label>
                            <div className="relative">
                                <User
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Digite seu usuário"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-3 transition"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>
                </div>
                {/* Rodapé */}
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <ShieldCheck size={16} />
                    <span>
                        Conexão protegida • MySQL • MariaDB
                    </span>
                </div>
            </div>
        </main>
    );
}