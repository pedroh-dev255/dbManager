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
    LogOut,
    RotateCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar({onSelect}) {
    const [servers, setServers] = useState([]);
    const [openServers, setOpenServers] = useState({});
    const [selected, setSelected] = useState(null);
    const router = useRouter();

    useEffect(() => {
        loadServers();
    }, []);

    async function logout(){
        try {
            const resposta = await fetch("/api/logout", {
                method: "POST"
            });
            const data = await resposta.json();

            toast.success(data.message);
            router.replace("/login");
        } catch (err) {
            console.error("Erro ao fazer logout:", err);
            toast.error("Erro ao sair: ", err.message);
        }
    }

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

        if (current?.databases) {
            setOpenServers(prev => ({
                ...prev,
                [serverId]: {
                    ...prev[serverId],
                    open: !prev[serverId].open,
                },
            }));
            return;
        }

        try {
            const databases = await loadDatabases(serverId);

            setOpenServers(prev => ({
                ...prev,
                [serverId]: {
                    open: true,
                    databases,
                },
            }));
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function reloadDatabases(serverId) {
        try {
            const databases = await loadDatabases(serverId, true);

            setOpenServers(prev => ({
                ...prev,
                [serverId]: {
                    ...prev[serverId],
                    open: true,
                    databases,
                },
            }));

            toast.success("Lista de bancos atualizada.");
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function loadDatabases(serverId, force = false) {
        const current = openServers[serverId];

        if (!force && current?.databases) {
            return current.databases;
        }

        const res = await fetch("/api/database", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ serverId }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message);
        }

        return data.dbList;
    }

    return (
        <aside className="w-72 h-screen bg-white border-r border-slate-200 flex flex-col">
            {/* Logo */}
            <div className="h-16 border-b border-slate-200 flex items-center gap-3 px-5">
                <img src="/icon-512.png" alt="icon" className="h-8.5" />
                <div>
                    <h1 className="font-bold text-slate-800">
                        dbManager
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
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        if (!server.ativo) return;
                                        setSelected({
                                            type: "server",
                                            serverId: server.id,
                                        });

                                        onSelect?.({
                                            type: "server",
                                            data: server,
                                        });

                                        toggleServer(server.id);
                                    }}
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
                                                ? "#9ca3af"
                                                : selected?.type === "server" &&
                                                selected.serverId === server.id
                                                    ? "#22c55e"
                                                    : "#2563eb"
                                        }
                                        className={
                                            !server.ativo
                                                ? "text-gray-400"
                                                : selected?.type === "server" &&
                                                selected.serverId === server.id
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
                                {server.ativo && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            reloadDatabases(server.id);
                                        }}
                                        title="Recarregar bancos"
                                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                                    >
                                        <RotateCw size={16} />
                                    </button>
                                )}
                            </div>

                            {serverState?.open && (
                                <div className="ml-8 mt-0 space-y-0">
                                    {serverState.databases.map(db => (
                                        <button
                                            key={db}
                                            onClick={() => {
                                                setSelected({
                                                    type: "server",
                                                    serverId: server.id,
                                                    database: db,
                                                });
                                                onSelect?.({
                                                    type: "database",
                                                    data: {
                                                        server,
                                                        database: db,
                                                    },
                                                })
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 "
                                            style={ selected.database == db ? {fontWeight: "bold", background: "#d3d3d3"} : {}}
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
                <button onClick={() => {
                        onSelect();
                        setSelected(null)
                        setOpenServers(false);
                        router.replace('/')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
                >
                    <Home size={18} />
                    Dashboard
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100">
                    <Settings size={18} />
                    Configurações
                </button>
                <button onClick={ async () => logout()} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </aside>
    );
}