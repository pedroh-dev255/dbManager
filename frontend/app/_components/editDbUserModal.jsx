"use client";

import { useState } from "react";
import { KeyRound, RefreshCw, Save, Server, User, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { generatePassword } from "../_utils/password";

export function isSystemUser(username) {
    return username === "mysql.sys" || username === "mysql.session" || username === "mysql.sessions" || username === "mysql.infoschema" || username === "mariadb.sys";
}

export default function EditDbUserModal({ open, mode = "edit", server, user, databases, onClose, onSaved }) {
    const isNew = mode === "create";
    const [form, setForm] = useState(() => ({ username: user?.username || "", host: user?.host || "", password: "", databases: user?.databases || [] }));
    const [saving, setSaving] = useState(false);

    const isRoot = !isNew && user?.username === "root";

    async function executeSql(sql) {
        const res = await fetch("/api/database/sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ serverId: server.id, sql }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || data.data?.rows?.[0]?.[0] || "Não foi possível atualizar o usuário.");
        }

        return data.data;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!/^[A-Za-z0-9_]{1,32}$/.test(form.username)) {
            toast.error("Nome de usuário inválido.");
            return;
        }
        if (!/^[A-Za-z0-9.%:_-]{1,255}$/.test(form.host)) {
            toast.error("IP ou origem permitida inválido.");
            return;
        }
        if (isNew && form.username === "root") {
            toast.error("Não é permitido criar uma nova conta root.");
            return;
        }
        if (isNew && !form.password) {
            toast.error("Defina uma senha para o novo usuário.");
            return;
        }

        setSaving(true);
        try {
            const updatedIdentity = userIdentity(form.username, form.host);

            if (isNew) {
                await executeSql(`CREATE USER ${updatedIdentity} IDENTIFIED BY ${sqlString(form.password)}`);
            } else {
                const originalIdentity = userIdentity(user.username, user.host);
                if (originalIdentity !== updatedIdentity) {
                    await executeSql(`RENAME USER ${originalIdentity} TO ${updatedIdentity}`);
                }
                if (form.password) {
                    await executeSql(`ALTER USER ${updatedIdentity} IDENTIFIED BY ${sqlString(form.password)}`);
                }
            }

            if (!isRoot) {
                const current = isNew ? [] : user.databases || [];
                const selected = new Set(form.databases);
                for (const database of current) {
                    if (!selected.has(database)) await executeSql(`REVOKE ALL PRIVILEGES ON ${sqlIdentifier(database)}.* FROM ${updatedIdentity}`);
                }
                for (const database of selected) {
                    if (!current.includes(database)) await executeSql(`GRANT ALL PRIVILEGES ON ${sqlIdentifier(database)}.* TO ${updatedIdentity}`);
                }
            }

            toast.success(isNew ? "Usuário criado com sucesso." : "Usuário atualizado com sucesso.");
            onSaved?.();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    }

    function toggleDatabase(database) {
        setForm(prev => ({
            ...prev,
            databases: prev.databases.includes(database)
                ? prev.databases.filter(item => item !== database)
                : [...prev.databases, database],
        }));
    }

    if (!open || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <button type="button" aria-label="Fechar modal" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" />
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600"><User size={24} /></div>
                        <div><h2 className="text-lg font-bold text-slate-800">{isNew ? "Novo usuário" : "Editar usuário"}</h2><p className="text-sm text-slate-500">{isNew ? `Servidor: ${server.nome}` : `${user.username}@${user.host}`}</p></div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-200"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    {isRoot && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">O usuário root pode ter apenas a senha e a origem alteradas.</p>}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="Usuário" value={form.username} disabled={isRoot} onChange={value => setForm(prev => ({ ...prev, username: value }))} />
                        <Input label="IP ou origem permitida" value={form.host} onChange={value => setForm(prev => ({ ...prev, host: value }))} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">{isNew ? "Senha" : "Nova senha"}</label>
                        <div className="mt-1.5 flex gap-2"><div className="relative flex-1"><KeyRound className="absolute left-3 top-3 text-slate-400" size={17} /><input required={isNew} type="text" value={form.password} onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))} placeholder={isNew ? "Informe ou gere uma senha" : "Deixe em branco para manter a atual"} className="w-full rounded-lg border py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500" /></div><button type="button" onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))} title="Gerar senha aleatória" className="inline-flex items-center gap-2 rounded-lg border px-3 text-sm text-blue-600 hover:bg-blue-50"><RefreshCw size={16} />Gerar</button></div>
                    </div>

                    {!isRoot && <div>
                        <div className="mb-2 flex items-center gap-2"><Server size={17} className="text-slate-500" /><h3 className="font-medium text-slate-700">Bancos com acesso</h3></div>
                        <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-3">
                            {databases.map(database => <label key={database.database} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.databases.includes(database.database)} onChange={() => toggleDatabase(database.database)} />{database.database}</label>)}
                        </div>
                    </div>}

                    <div className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"><Save size={17} />{saving ? "Salvando..." : isNew ? "Criar usuário" : "Salvar alterações"}</button></div>
                </form>
            </div>
        </div>
    );
}

function Input({ label, value, disabled, onChange }) {
    return <div><label className="text-sm font-medium text-slate-600">{label}</label><input required disabled={disabled} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100" /></div>;
}

function sqlString(value) {
    return `'${value.replaceAll("'", "''")}'`;
}

function sqlIdentifier(value) {
    return `\`${value.replaceAll("`", "``")}\``;
}

function userIdentity(username, host) {
    return `${sqlString(username)}@${sqlString(host)}`;
}
