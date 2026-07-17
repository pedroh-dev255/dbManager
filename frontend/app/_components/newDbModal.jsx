"use client";

import { useState } from "react";
import { Copy, Database, KeyRound, Server, User, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { generatePassword } from "../_utils/password";

const initialForm = {
    database: "",
    username: "",
    allowedHost: "%",
};

export default function NewDbModal({ open, server, onClose, onCreated }) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState(null);

    if (!open) return null;

    function close() {
        setForm(initialForm);
        setCredentials(null);
        onClose();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        const password = generatePassword();

        try {
            if (!/^[A-Za-z0-9_]{1,64}$/.test(form.database) || !/^[A-Za-z0-9_]{1,32}$/.test(form.username)) {
                throw new Error("Use somente letras, números e _ no nome do banco e do usuário.");
            }
            if (!/^[A-Za-z0-9.%:_-]{1,255}$/.test(form.allowedHost)) {
                throw new Error("IP ou origem permitida inválido.");
            }

            await executeSql(`CREATE DATABASE \`${form.database}\``);
            await executeSql(`CREATE USER '${form.username}'@'${form.allowedHost}' IDENTIFIED BY '${password}'`);
            await executeSql(`GRANT ALL PRIVILEGES ON \`${form.database}\`.* TO '${form.username}'@'${form.allowedHost}'`);

            setCredentials({ ...form, password });
            onCreated?.();
            toast.success("Banco e usuário criados com sucesso.");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function executeSql(sql) {
        const res = await fetch("/api/database/sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ serverId: server.id, sql }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || data.data?.rows?.[0]?.[0] || "Não foi possível criar o banco.");
        }
    }

    async function copyPassword() {
        await navigator.clipboard.writeText(credentials.password);
        toast.success("Senha copiada.");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <button
                type="button"
                aria-label="Fechar modal"
                onClick={close}
                className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Novo banco de dados</h2>
                            <p className="text-sm text-slate-500">Servidor: {server.nome}</p>
                        </div>
                    </div>
                    <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {credentials ? (
                    <div className="space-y-5 p-6">
                        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                            Banco e usuário criados. Salve a senha agora: ela não será exibida novamente.
                        </div>
                        <Credential icon={Database} label="Banco" value={credentials.database} />
                        <Credential icon={User} label="Usuário" value={credentials.username} />
                        <Credential icon={Server} label="Origem permitida" value={credentials.allowedHost} />
                        <div>
                            <span className="mb-1 block text-sm font-medium text-slate-600">Senha gerada</span>
                            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3 font-mono text-slate-800">
                                <KeyRound size={16} className="text-slate-500" />
                                <span className="flex-1">{credentials.password}</span>
                                <button type="button" onClick={copyPassword} title="Copiar senha" className="rounded p-1 text-blue-600 hover:bg-blue-100">
                                    <Copy size={17} />
                                </button>
                            </div>
                        </div>
                        <button type="button" onClick={close} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700">
                            Concluir
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 p-6">
                        <Field label="Nome do banco" name="database" value={form.database} placeholder="meu_banco" onChange={value => setForm(prev => ({ ...prev, database: value }))} />
                        <Field label="Nome do usuário" name="username" value={form.username} placeholder="meu_usuario" onChange={value => setForm(prev => ({ ...prev, username: value }))} />
                        <div>
                            <label className="text-sm font-medium text-slate-600" htmlFor="allowedHost">IP ou origem permitida</label>
                            <input id="allowedHost" required name="allowedHost" value={form.allowedHost} onChange={event => setForm(prev => ({ ...prev, allowedHost: event.target.value }))} placeholder="%" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                            <p className="mt-1.5 text-xs text-slate-500">Use % para permitir conexão de qualquer IP.</p>
                        </div>
                        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Uma senha aleatória de 12 caracteres será gerada para este usuário.</p>
                        <div className="flex justify-end gap-3 border-t pt-5">
                            <button type="button" onClick={close} className="rounded-lg border px-4 py-2 hover:bg-slate-50">Cancelar</button>
                            <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">{loading ? "Criando..." : "Criar banco"}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Field({ label, name, value, placeholder, onChange }) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-600" htmlFor={name}>{label}</label>
            <input id={name} required name={name} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
    );
}

function Credential({ icon: Icon, label, value }) {
    return (
        <div>
            <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
            <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3 text-slate-800">
                <Icon size={16} className="text-slate-500" />
                {value}
            </div>
        </div>
    );
}
