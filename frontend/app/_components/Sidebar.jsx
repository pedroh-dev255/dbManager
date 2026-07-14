"use client";

import { useEffect, useState } from "react";
import {
    Database,
    Server,
    Plus,
    ChevronDown,
    ChevronRight,
    Circle,
    Home,
    Settings,
    LogOut
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Sidebar() {
    const [servers, setServers] = useState([]);
    const [openServers, setOpenServers] = useState({});

    useEffect(() => {
        loadServers();
    }, []);

    async function loadServers() {
        try {
            const res = await fetch('/api/server/', {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json'
                },
                credentials: 'include',
            });
            const data = await res.json();
            if(data.success !== true){
                toast.error(data.message)
            }
            toast.success(`${data.message}`);
            setServers(data.connData)
        } catch (error) {
            toast.error(error.message);
        }

    }

    async function toggleServer(serverId) {

        const current = openServers[serverId];

        // Se já carregou os bancos, apenas abre/fecha
        if (current?.databases) {
            setOpenServers(prev => ({
                ...prev,
                [serverId]: {
                    ...prev[serverId],
                    open: !prev[serverId].open
                }
            }));

            return;
        }

        try {

            const res = await fetch("/api/database", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    serverId
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.message);
                return;
            }

            setOpenServers(prev => ({
                ...prev,
                [serverId]: {
                    open: true,
                    databases: data.dbList
                }
            }));

        } catch (error) {
            toast.error(error.message);
        }

    }

    return (
        <aside className="w-72 h-screen bg-white border-r border-slate-200 flex flex-col">

            {/* Logo */}

            <div className="h-16 border-b border-slate-200 flex items-center gap-3 px-5">

                <Database className="text-blue-600" />

                <div>

                    <h1 className="font-bold text-slate-800">
                        DB Manager
                    </h1>

                    <p className="text-xs text-slate-500">
                        MySQL / MariaDB
                    </p>

                </div>

            </div>

            {/* Novo servidor */}

            <div className="p-4">

                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 transition">

                    <Plus size={18} />

                    Novo Servidor

                </button>

            </div>

            {/* Lista */}

            <div className="flex-1 overflow-y-auto px-2">

                {servers.map(server => {

                    const serverState = openServers[server.id];

                    return (

                        <div key={server.id} className="mb-1">

                            <button
                                onClick={() => server.ativo && toggleServer(server.id)}
                                disabled={!server.ativo}
                                className={`
                                    w-full flex items-center gap-2 px-3 py-2 rounded-lg transition
                                    ${
                                        server.ativo
                                            ? "hover:bg-slate-100 cursor-pointer"
                                            : "cursor-not-allowed opacity-60"
                                    }
                                `}
                            >

                                {serverState?.open ? (
                                    <ChevronDown size={17} />
                                ) : (
                                    <ChevronRight size={17} />
                                )}

                                <Circle
                                    size={10}
                                    fill={
                                        !server.ativo
                                            ? "#9ca3af"     // cinza
                                            : serverState?.open
                                                ? "#22c55e" // verde
                                                : "#2563eb" // azul
                                    }
                                    className={
                                        !server.ativo
                                            ? "text-gray-400"
                                            : serverState?.open
                                                ? "text-green-500"
                                                : "text-blue-600"
                                    }
                                />

                                <Server
                                    size={18}
                                    className={
                                        !server.ativo
                                            ? "text-gray-400"
                                            : "text-slate-600"
                                    }
                                />
                                <div className="flex flex-col items-start min-w-0">
                                    <span
                                        className={`truncate text-sm font-medium ${
                                            !server.ativo
                                                ? "text-gray-400"
                                                : "text-slate-700"
                                        }`}
                                    >
                                        {server.nome}
                                    </span>
                                    <span
                                        className={`truncate text-xs ${
                                            !server.ativo
                                                ? "text-gray-400"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {server.host}
                                    </span>
                                </div>
                            </button>

                            {serverState?.open && (

                                <div className="ml-8 mt-0 space-y-0">

                                    {serverState.databases.map(db => (

                                        <button
                                            key={db}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                        >

                                            <Database
                                                size={15}
                                                className="text-blue-500"
                                            />

                                            {db}

                                        </button>

                                    ))}

                                </div>

                            )}

                        </div>

                    );

                })}

            </div>

            {/* Footer */}

            <div className="border-t border-slate-200 p-2">

                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100">

                    <Home size={18} />

                    Dashboard

                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100">

                    <Settings size={18} />

                    Configurações

                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">

                    <LogOut size={18} />

                    Sair

                </button>

            </div>

        </aside>
    );

}