'use client';

import { useState } from 'react';
import {
    X,
    Server,
    Database,
    Globe,
    User,
    Lock,
    FileText,
    Shield,
    Save,
    CircleOff,
    Plug,
    Check,
    ServerOff
} from 'lucide-react';
import { toast } from "react-hot-toast";
import { fromNodeOutgoingHttpHeaders } from 'next/dist/server/web/utils';

export default function NewServerModal({
    open,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [loadingAdd, setLoadingAdd] = useState(false);
    const [tryConn, setTryconn] = useState(0);
    const [form, setForm] = useState({
        nome: "",
        descricao: "",
        host: "",
        porta: 3306,
        usuario: "",
        senha: "",
        tipo: "mysql",
        ssl_active: false,
        ativo: true,
    });

    if (!open) return null;

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoadingAdd(true);
        try {
            const res = await fetch("/api/server/add",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:"include",
                body:JSON.stringify(form)
            });

            const data = await res.json();

            if(data.success !== true){
                toast.error(data.message);
                return;
            }

            toast.success(data.message)
            setForm({
                nome: "",
                descricao: "",
                host: "",
                porta: 3306,
                usuario: "",
                senha: "",
                tipo: "mysql",
                ssl_active: false,
                ativo: true,
            });
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoadingAdd(false);
        }
        

    }

    async function tryconnection(){
        setLoading(true);
        setTryconn(0);
        if(!form.host?.trim() || !form.host?.trim()  || !form.usuario?.trim()){
            toast.error("Preencha todos os Dados Obrigatorios!");
            setTryconn(3);
            return;
        }
        const host = form.host;
        const port = form.porta;
        const user = form.usuario;
        const pass = form.senha;
        try {
            const res = await fetch("/api/server",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:"include",
                body:JSON.stringify({host, port,user,pass})
            });

            const data = await res.json();

            if(data.success !== true){
                toast.error(data.message);
                setTryconn(2);
                return;
            }
            toast.success(data.message);
            setTryconn(1);
        } catch (error) {
            setTryconn(3);
            toast.error(error.message);
        }finally{
            setLoading(false);
        }
    }

    function Switch({ checked, onChange }) {
        return (
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`
                    relative
                    h-7
                    w-12
                    rounded-full
                    transition
                    ${checked ? "bg-blue-600" : "bg-gray-300"}
                `}
            >
                <span
                    className={`
                        absolute
                        top-1
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow
                        transition-all
                        ${checked ? "left-6" : "left-1"}
                    `}
                />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Overlay */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 bg-slate-50">

                    <div className="flex items-center gap-4">

                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Server size={28} className="text-blue-600" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Novo Servidor
                            </h2>

                            <p className="text-sm text-slate-500">
                                Cadastre uma conexão MySQL ou MariaDB
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-slate-200"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* BODY */}

                <form onSubmit={handleSubmit}>

                    <div className="p-8 bg-slate-100">

                        <div className="grid grid-cols-2 gap-6">

                            {/* ESQUERDA */}

                            <div className="bg-white rounded-xl border p-6">

                                <div className="flex items-center gap-2 mb-6">
                                    <Database className="text-blue-600" size={20} />
                                    <h3 className="font-semibold text-slate-800">
                                        Informações
                                    </h3>
                                </div>

                                <div className="space-y-5">

                                    <div>
                                        <label className="text-sm font-medium text-slate-600">
                                            Nome *
                                        </label>

                                        <input
                                            required
                                            name="nome"
                                            value={form.nome}
                                            onChange={handleChange}
                                            placeholder="Servidor Principal"
                                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                        />
                                    </div>

                                    <div>

                                        <label className="text-sm font-medium text-slate-600">
                                            Descrição
                                        </label>

                                        <textarea
                                            rows={5}
                                            name="descricao"
                                            value={form.descricao}
                                            onChange={handleChange}
                                            placeholder="Descrição opcional..."
                                            className="mt-2 w-full rounded-lg border px-4 py-3 resize-none outline-none focus:border-blue-600"
                                        />

                                    </div>

                                    <div>

                                        <label className="text-sm font-medium text-slate-600">
                                            Tipo
                                        </label>

                                        <select
                                            name="tipo"
                                            value={form.tipo}
                                            onChange={handleChange}
                                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                        >
                                            <option value="mysql">
                                                MySQL
                                            </option>

                                            <option value="mariadb">
                                                MariaDB
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>

                            {/* DIREITA */}

                            <div className="bg-white rounded-xl border p-6">

                                <div className="flex items-center gap-2 mb-6">
                                    <Plug className="text-green-600" size={20} />
                                    <h3 className="font-semibold text-slate-800">
                                        Conexão
                                    </h3>
                                </div>

                                <div className="space-y-5">

                                    <div>

                                        <label className="text-sm font-medium text-slate-600">
                                            Host *
                                        </label>

                                        <input
                                            required
                                            name="host"
                                            value={form.host}
                                            onChange={handleChange}
                                            placeholder="127.0.0.1"
                                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                        />

                                    </div>

                                    <div className="grid grid-cols-2 gap-4">

                                        <div>

                                            <label className="text-sm font-medium text-slate-600">
                                                Porta *
                                            </label>

                                            <input
                                                required
                                                type="number"
                                                name="porta"
                                                value={form.porta}
                                                onChange={handleChange}
                                                className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                            />

                                        </div>

                                        <div>

                                            <label className="text-sm font-medium text-slate-600">
                                                Usuário *
                                            </label>

                                            <input
                                                required
                                                name="usuario"
                                                value={form.usuario}
                                                onChange={handleChange}
                                                className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                            />

                                        </div>

                                    </div>

                                    <div>

                                        <label className="text-sm font-medium text-slate-600">
                                            Senha *
                                        </label>

                                        <input
                                            required
                                            type="password"
                                            name="senha"
                                            value={form.senha}
                                            onChange={handleChange}
                                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* CARDS */}

                        <div className="grid grid-cols-2 gap-6 mt-6">

                            <div className="bg-white rounded-xl border p-5 flex items-center justify-between">

                                <div>

                                    <div className="font-semibold flex items-center gap-2">
                                        <Shield className="text-blue-600" size={18}/>
                                        SSL
                                    </div>

                                    <div className="text-sm text-slate-500 mt-1">
                                        Utilizar conexão criptografada.
                                    </div>

                                </div>

                                <Switch
                                    checked={form.ssl_active}
                                    onChange={(v)=>setForm({...form,ssl_active:v})}
                                />

                            </div>

                            <div className="bg-white rounded-xl border p-5 flex items-center justify-between">

                                <div>

                                    <div className="font-semibold flex items-center gap-2">
                                        <Server className="text-green-600" size={18}/>
                                        Servidor ativo
                                    </div>

                                    <div className="text-sm text-slate-500 mt-1">
                                        Permitir utilização desta conexão.
                                    </div>

                                </div>

                                <Switch
                                    checked={form.ativo}
                                    onChange={(v)=>setForm({...form,ativo:v})}
                                />

                            </div>

                        </div>

                    </div>

                    {/* FOOTER */}

                    <div className="border-t bg-white px-8 py-5 flex items-center justify-between">

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-lg border px-5 py-3 hover:bg-slate-100"
                        >
                            <CircleOff size={18}/>
                            Cancelar
                        </button>

                        <div className="flex gap-3">

                            <button
                            onClick={() => tryconnection()}
                                type="button"
                                className="flex h-13 items-center gap-2 rounded-lg border border-blue-600 px-5 py-3 text-blue-600 hover:bg-blue-50"
                            >
                                {tryConn == 0 ? (
                                    <>
                                        {loading ? (
                                            <svg
                                                className="h-8 w-8 animate-spin text-blue-600"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-20"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />

                                                <path
                                                    className="opacity-90"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                        ) : (<Plug size={18}/>)}
                                        
                                        Testar conexão
                                    </>
                                ) : tryConn == 1 ? (
                                        <div className="flex items-center gap-1" style={{color: "green"}}>
                                            <Check  size={18}/>
                                            Conexão OK
                                        </div>
                                ) : tryConn == 2 ? (
                                    <div className="flex items-center gap-1" style={{color: "red"}}>
                                        <X  size={18}/>
                                        Erro na Conexão
                                    </div>
                                ) :
                                (
                                    <div className="flex items-center gap-1" style={{color: "red"}}>
                                        <ServerOff  size={18}/>
                                        Falha ao testar conexão
                                    </div>
                                )}
                                
                            </button>
                            {loading ? (
                                <div
                                    className="flex h-13 cursor-not-allowed items-center gap-2 rounded-lg bg-gray-300 px-6 py-3 text-black hover:bg-gray-500"
                                >
                                    <Save size={18}/>
                                    Adicionar servidor
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                                >
                                    <Save size={18}/>
                                    Adicionar servidor
                                </button>
                            )}
                            
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}


