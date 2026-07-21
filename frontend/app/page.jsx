"use client";

import { useState, useEffect } from "react";
import Sidebar from "./_components/Sidebar";
import NewDbModal from "./_components/newDbModal";
import EditDbUserModal, { isSystemUser } from "./_components/editDbUserModal";
import {
    Database,
    Server,
    HardDrive,
    Activity,
    Clock,
    SquareFunction,
    Table,
    AlarmCheckIcon,
    CheckCircle2,
    AlertTriangle,
    LoaderCircle,
    Users,
    Plus,
    Pencil,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from 'next/navigation';

export default function Home() {
    const [selected, setSelected] = useState(null);
    const router = useRouter();

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar
                onSelect={setSelected}
            />
            <main className="flex-1 overflow-auto">
                {!selected ? (
                    <Dashboard />
                ) : selected.type === "server-loading" ? (
                    <ServerLoading server={selected.data} />
                ) : selected.type === "connection-error" ? (
                    <ConnectionError server={selected.data} error={selected.error} />
                ) : selected.type === "server" ? (
                    <ServerDetails server={selected.data} />
                ) : (
                    <DatabaseDetails database={selected.data} />
                )}
            </main>
        </div>
    );

}

function ServerLoading({ server }) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
                <LoaderCircle size={38} className="mx-auto mb-4 animate-spin text-blue-600" />
                <h1 className="text-lg font-semibold text-slate-800">
                    Carregando bancos de dados...
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Conectando ao servidor {server.nome}.
                </p>
            </div>
        </div>
    );
}

function ConnectionError({ server, error }) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <AlertTriangle size={42} className="mx-auto mb-4 text-red-500" />
                <h1 className="text-lg font-semibold text-slate-800">
                    Erro de conexão
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Não foi possível carregar os bancos de dados de {server.nome}.
                </p>
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error || "Verifique a conexão e tente novamente."}
                </p>
            </div>
        </div>
    );
}

function sqlLiteral(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
}


function Dashboard() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 ">
            <img src="/icon-512.png" className="h-50" alt="dbManager" />
        </div>
    );
}

function ServerDetails({ server }) {
    const [tab, setTab] = useState("databases");
    const [loading, setLoading] = useState(true);
    const [databases, setDatabases] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");
    const [newDbOpen, setNewDbOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUserOpen, setNewUserOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setSqlPage] = useState(1);
    const [sql, setSql] = useState("");
    const [sqlLoading, setSqlLoading] = useState(false);
    const [sqlResult, setSqlResult] = useState(null);

    const tabs = [
        {
            id: "databases",
            icon: Database,
            label: "Bancos"
        },
        {
            id: "sql",
            icon: Server,
            label: "SQL"
        },
        {
            id: "users",
            icon: Users,
            label: "Usuários"
        }
    ];

    useEffect(() => {
        loadDatabases();
    }, [server.id]);

    useEffect(() => {
        if (tab === "users") loadUsers();
    }, [tab, server.id]);

    async function loadDatabases() {
        try {
            setLoading(true);

            const res = await fetch("/api/database/details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    serverId: server.id,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message);
            }

            setDatabases(data.databases);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadUsers() {
        try {
            setUsersLoading(true);
            setUsersError("");

            const res = await fetch("/api/database/sql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    serverId: server.id,
                    sql: "SELECT User AS username, Host AS host FROM mysql.user ORDER BY User, Host",
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Não foi possível carregar os usuários.");
            }

            setUsers((data.data?.rows || []).map(([username, host]) => ({ username, host })));
        } catch (error) {
            const message = error.message || "Não foi possível carregar os usuários.";
            setUsersError(message);
            toast.error(message);
        } finally {
            setUsersLoading(false);
        }
    }

    async function openUserEditor(user) {
        try {
            const grantee = `${sqlLiteral(user.username)}@${sqlLiteral(user.host)}`;
            const res = await fetch("/api/database/sql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    serverId: server.id,
                    sql: `SELECT DISTINCT TABLE_SCHEMA FROM information_schema.SCHEMA_PRIVILEGES WHERE GRANTEE = ${sqlLiteral(grantee)} ORDER BY TABLE_SCHEMA`,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Não foi possível consultar os acessos do usuário.");
            }

            setEditingUser({
                ...user,
                databases: (data.data?.rows || []).map(([database]) => database),
            });
        } catch (error) {
            toast.error(error.message || "Não foi possível abrir a edição do usuário.");
        }
    }

    async function executeSQL(page) {
        if (!sql.trim()) {
            toast.error("Digite um comando SQL.");
            return;
        }

        try {
            setSqlLoading(true);

            const res = await fetch("/api/database/sql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    serverId: server.id,
                    page,
                    sql,
                }),
            });

            const data = await res.json();
            //console.log(data);

            setSqlPage(page);
            setSqlResult(data.data);

            if (!data.success) {
                toast.error(data.message);
                return;
            }

            toast.success(data.message);

        } catch (err) {
            toast.error(err.message);
        } finally {
            setSqlLoading(false);
        }
    }

    const filtered = databases.filter(db =>
        db.database.toLowerCase().includes(search.toLowerCase())
    );


    const snippets = [
        {
            nome: "SHOW DATABASES",
            sql: "SHOW DATABASES;"
        },
        {
            nome: "SHOW TABLES",
            sql: "SHOW TABLES;"
        },
        {
            nome: "SHOW PROCESSLIST",
            sql: "SHOW PROCESSLIST;"
        },
        {
            nome: "SHOW VARIABLES",
            sql: "SHOW VARIABLES;"
        },
        {
            nome: "SHOW STATUS",
            sql: "SHOW STATUS;"
        },
        {
            nome: "SHOW GRANTS",
            sql: "SHOW GRANTS;"
        }
    ];
    return (
        <div className="p-6 space-y-6">

            <header>
                <div className="bg-white rounded-xl border p-5 flex justify-between">

                    <div>

                        <h1 className="flex w-full items-center gap-2 text-2xl font-bold">
                            <Server
                                size={25}
                                className="text-blue-500"
                            />
                            {server.nome}
                        </h1>

                        <p className="text-slate-500">
                            {server.host}:{server.porta}
                        </p>

                    </div>

                    <div className="text-right">

                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">

                            <CheckCircle2 size={16}/>

                            Online

                        </span>

                    </div>

                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border">

                <div className="border-b flex">
                    <div className="border-b flex">

                        {tabs.map(tabItem => {

                            const Icon = tabItem.icon;

                            return (

                                <button
                                    key={tabItem.id}
                                    onClick={() => setTab(tabItem.id)}
                                    className={`
                                        flex items-center gap-2
                                        px-5 py-3
                                        border-b-2
                                        ${
                                            tab === tabItem.id
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-500 hover:bg-slate-50"
                                        }
                                    `}
                                >

                                    <Icon size={18}/>

                                    {tabItem.label}

                                </button>

                            );

                        })}

                    </div>
                </div>

                <div className="p-5">

                    {tab === "databases" && (
                        <div className="space-y-5">

                            {/* Header */}

                            <div className="flex items-center justify-between">

                                <input
                                    type="text"
                                    placeholder="Pesquisar banco..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-80 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewDbOpen(true)}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
                                    >
                                        <Plus size={17} />
                                        Novo banco
                                    </button>
                                    <button
                                        onClick={loadDatabases}
                                        className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 transition"
                                    >
                                        Atualizar
                                    </button>
                                </div>

                            </div>

                            {/* Loading */}

                            {loading && (
                                <div className="overflow-hidden rounded-xl border bg-white">

                                    <table className="w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                {[
                                                    "Banco",
                                                    "Charset",
                                                    "Collation",
                                                    "Tabelas",
                                                    "Tamanho",
                                                ].map(col => (
                                                    <th
                                                        key={col}
                                                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {Array.from({ length: 8 }).map((_, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t"
                                                >

                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <td
                                                            key={i}
                                                            className="px-4 py-4"
                                                        >
                                                            <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                                                        </td>
                                                    ))}

                                                </tr>
                                            ))}

                                        </tbody>

                                    </table>

                                </div>
                            )}

                            {/* Sem resultados */}

                            {!loading && filtered.length === 0 && (
                                <div className="rounded-xl border bg-white p-12 text-center">

                                    <Database
                                        size={50}
                                        className="mx-auto mb-3 text-slate-300"
                                    />

                                    <h2 className="text-lg font-semibold">
                                        Nenhum banco encontrado
                                    </h2>

                                    <p className="text-slate-500 mt-1">
                                        Não existem bancos neste servidor ou a pesquisa não retornou resultados.
                                    </p>

                                </div>
                            )}

                            {/* Tabela */}

                            {!loading && filtered.length > 0 && (
                                <div className="overflow-hidden rounded-xl border bg-white">

                                    <table className="w-full">

                                        <thead className="sticky top-0 bg-slate-100">

                                            <tr>

                                                <th className="px-4 py-3 text-left">
                                                    Banco
                                                </th>

                                                <th className="px-4 py-3 text-left">
                                                    Charset
                                                </th>

                                                <th className="px-4 py-3 text-left">
                                                    Collation
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Tabelas
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Tamanho
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {filtered.map(db => (

                                                <tr
                                                    key={db.name}
                                                    className="border-t hover:bg-slate-50 transition"
                                                >

                                                    <td className="px-4 py-3 font-medium text-slate-800">

                                                        <div className="flex items-center gap-2">

                                                            <Database
                                                                size={16}
                                                                className="text-blue-600"
                                                            />

                                                            {db.database}

                                                        </div>

                                                    </td>

                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.charset}
                                                    </td>

                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.collation}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">

                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                                            {db.tables}
                                                        </span>

                                                    </td>

                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.size}
                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </div>
                    )}

                    {tab === "users" && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-800">Usuários do servidor</h2>
                                    <p className="text-sm text-slate-500">Contas MySQL/MariaDB configuradas nesta conexão.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewUserOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                        <Plus size={17} /> Novo usuário
                                    </button>
                                    <button onClick={loadUsers} disabled={usersLoading} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-60">
                                        Atualizar
                                    </button>
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="space-y-3 rounded-xl border p-5">
                                    {[1, 2, 3, 4].map(item => <div key={item} className="h-5 animate-pulse rounded bg-slate-200" />)}
                                </div>
                            ) : usersError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{usersError}</div>
                            ) : users.length === 0 ? (
                                <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Nenhum usuário encontrado.</div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="bg-slate-100 text-left text-sm text-slate-700">
                                            <tr><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Origem permitida</th><th className="px-4 py-3 text-right">Ações</th></tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={`${user.username}@${user.host}`} className="border-t">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                                                    <td className="px-4 py-3 text-slate-600">{user.host}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {isSystemUser(user.username) ? (
                                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">Sistema</span>
                                                        ) : (
                                                            <button onClick={() => openUserEditor(user)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50">
                                                                <Pencil size={15} /> Editar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "sql" && (
                        <div className="space-y-5">

                            {/* Snippets */}

                            <div className="flex flex-wrap gap-2">

                                {snippets.map(snippet => (

                                    <button
                                        key={snippet.nome}
                                        onClick={() => setSql(snippet.sql)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                                    >
                                        {snippet.nome}
                                    </button>

                                ))}

                            </div>

                            {/* Editor */}

                            <textarea
                                value={sql}
                                onChange={(e) => {
                                    setSql(e.target.value);
                                    setSqlPage(1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === "Enter") {
                                        executeSQL(page);
                                    }
                                }}
                                spellCheck={false}
                                placeholder="Digite seu SQL aqui..."
                                className="h-26 w-full rounded-lg border border-slate-300 bg-white-950 p-4 font-mono text-sm text-black-300 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex gap-3">

                                <button
                                    onClick={() => executeSQL(page)}
                                    disabled={sqlLoading}
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {sqlLoading ? "Executando..." : "Executar (Ctrl+Enter)"}
                                </button>

                                <button
                                    onClick={() => {
                                        setSql("");
                                        setSqlResult(null);
                                    }}
                                    className="rounded-lg border border-slate-300 px-5 py-2 hover:bg-slate-100"
                                >
                                    Limpar
                                </button>

                            </div>

                            {/* Resultado */}

                            {sqlResult && (

                                <div className="rounded-xl border bg-white overflow-hidden">

                                    <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">

                                        <span className="font-medium">
                                            Resultado
                                        </span>

                                        {sqlResult.rowsSize && (
                                            <div>
                                                <button
                                                    disabled={sqlLoading || page <= 1}
                                                    onClick={() => executeSQL(page - 1)}
                                                    className="disabled:opacity-50"
                                                >
                                                    <ArrowLeft size={20}/>
                                                </button>
                                                <span className="text-sm text-slate-500">
                                                    Página {sqlResult.rowsSize[0]} • Mais {sqlResult.rowsSize[1]} página(s)
                                                </span>
                                                <button
                                                    disabled={
                                                        sqlLoading ||
                                                        page >= sqlResult.rowsSize[1]
                                                    }
                                                    onClick={() => executeSQL(page + 1)}
                                                    className="disabled:opacity-50"
                                                >
                                                    <ArrowRight size={20}/>
                                                </button>
                                            </div>
                                        )}

                                    </div>

                                    {sqlResult.rows.length === 0 ? (

                                        <div className="p-10 text-center text-slate-500">
                                            A consulta não retornou registros.
                                        </div>

                                    ) : (

                                        <div className="overflow-auto max-h-[500px]">

                                            <table className="min-w-full text-sm">

                                                <thead className="sticky top-0 bg-slate-100">

                                                    <tr>

                                                        {sqlResult.columns.map(column => (

                                                            <th
                                                                key={column}
                                                                className="border-b px-4 py-3 text-left font-semibold whitespace-nowrap"
                                                            >
                                                                {column}
                                                            </th>

                                                        ))}

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {sqlResult.rows.map((row, rowIndex) => (

                                                        <tr
                                                            key={rowIndex}
                                                            className="border-b hover:bg-slate-50"
                                                        >

                                                            {row.map((value, columnIndex) => (

                                                                <td
                                                                    key={columnIndex}
                                                                    className="px-4 py-3 whitespace-nowrap"
                                                                >

                                                                    {value === null
                                                                        ? (
                                                                            <span className="italic text-slate-400">
                                                                                NULL
                                                                            </span>
                                                                        )
                                                                        : String(value)
                                                                    }

                                                                </td>

                                                            ))}

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>
                    )}

                </div>

            </div>

            <NewDbModal
                open={newDbOpen}
                server={server}
                onClose={() => setNewDbOpen(false)}
                onCreated={() => {
                    loadDatabases();
                    loadUsers();
                }}
            />

            {editingUser && (
                <EditDbUserModal
                    key={`${editingUser.username}@${editingUser.host}`}
                    open
                    server={server}
                    user={editingUser}
                    databases={databases}
                    onClose={() => setEditingUser(null)}
                    onSaved={() => {
                        loadUsers();
                        loadDatabases();
                    }}
                />
            )}

            {newUserOpen && (
                <EditDbUserModal
                    key="new-user"
                    open
                    mode="create"
                    server={server}
                    user={{ username: "", host: "%", databases: [] }}
                    databases={databases}
                    onClose={() => setNewUserOpen(false)}
                    onSaved={loadUsers}
                />
            )}

        </div>
    );
}

function DatabaseDetails({ database }) {
    const [tab, setTab] = useState("tables");
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState([]);
    const [views, setViews] = useState([]);
    const [triggers, setTriggers] = useState([]);
    const [functions, setFunctions] = useState([]);
    const [search, setSearch] = useState("");

    const [sql, setSql] = useState("");
    const [page, setSqlPage] = useState(1);
    const [sqlLoading, setSqlLoading] = useState(false);
    const [sqlResult, setSqlResult] = useState(null);

    useEffect(() => {
        loadTables();
    }, [database.database]);

    async function loadTables() {
        try {
            setLoading(true);

            const res = await fetch("/api/database/db/details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    serverId: database.server.id,
                    database: database.database
                }),
            });

            const data = await res.json();
            console.log(data)

            if(data.success !== true){
                throw new Error(data.message)
            }

            setTables(data.data.tables);
            setViews(data.data.views);
            setFunctions(data.data.functions);
            setTriggers(data.data.triggers);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        {
            id: "tables",
            icon: Table,
            label: "Tabelas"
        },
        {
            id: "functions",
            icon: SquareFunction,
            label: "Funções"
        },
        {
            id: "triggers",
            icon: AlarmCheckIcon,
            label: "Triggers"
        },
        {
            id: "sql",
            icon: Server,
            label: "SQL"
        }
    ];


    const snippets = [
        {
            nome: "INSERT",
            sql: `INSERT INTO ${database.database}. () VALUES ();`
        },
        {
            nome: "UPDATE",
            sql: "SHOW TABLES;"
        },
        {
            nome: "SELECT",
            sql: `SELECT * FROM ${database.database}.`
        },
        {
            nome: "DROP",
            sql: `DROP TABLE ${database.database}.`
        },
        {
            nome: "CREATE",
            sql: `CREATE TABLE ${database.database}.`
        }
    ];

    const filtered_tables = Array.isArray(tables)
    ? tables.filter(tb =>
        tb.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

    const filtered_functions = Array.isArray(functions)
    ? functions.filter(fun =>
        fun.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

    const filtered_triggers = Array.isArray(triggers)
    ? triggers.filter(tri =>
        tri.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

    async function executeSQL(page) {
        if (!sql.trim()) {
            toast.error("Digite um comando SQL.");
            return;
        }

        try {
            setSqlLoading(true);

            const res = await fetch("/api/database/sql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    serverId: database.server.id,
                    page,
                    sql,
                }),
            });

            const data = await res.json();
            //console.log(data);

            setSqlPage(page);
            setSqlResult(data.data);

            if (!data.success) {
                toast.error(data.message);
                return;
            }

            toast.success(data.message);

        } catch (err) {
            toast.error(err.message);
        } finally {
            setSqlLoading(false);
        }
    }


    return (
        <div className="p-6 space-y-6">
            <header>
                <div className="bg-white rounded-xl border p-5 flex justify-between">
                    <div>
                        <h1 className="flex w-full items-center gap-2 text-2xl font-bold">
                            <Database
                                size={25}
                                className="text-blue-500"
                            />
                            {database.database}
                        </h1>
                        <p className="text-slate-500">
                            Banco de dados • {database.server.host}:{database.server.porta}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            <CheckCircle2 size={16}/>
                            Online
                        </span>
                    </div>
                </div>
            </header>
            <div className="bg-white rounded-xl shadow-sm border">

                <div className="border-b flex">
                    <div className="border-b flex">

                        {tabs.map(tabItem => {

                            const Icon = tabItem.icon;

                            return (

                                <button
                                    key={tabItem.id}
                                    onClick={() => setTab(tabItem.id)}
                                    className={`
                                        flex items-center gap-2
                                        px-5 py-3
                                        border-b-2
                                        ${
                                            tab === tabItem.id
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-500 hover:bg-slate-50"
                                        }
                                    `}
                                >

                                    <Icon size={18}/>

                                    {tabItem.label}

                                </button>

                            );

                        })}

                    </div>
                </div>
                
                <div className="p-5">
                    {tab === "tables" && (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    placeholder="Pesquisar tabela..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-80 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={loadTables}
                                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 transition"
                                >
                                    Atualizar
                                </button>
                            </div>
                            {/* Loading */}
                            {loading && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                {[
                                                    "Nome",
                                                    "engine",
                                                    "Total Rows",
                                                    "Tamanho",
                                                    "CharSet",
                                                ].map(col => (
                                                    <th
                                                        key={col}
                                                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 8 }).map((_, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t"
                                                >
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <td
                                                            key={i}
                                                            className="px-4 py-4"
                                                        >
                                                            <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Sem resultados */}
                            {!loading && filtered_tables.length === 0 && (
                                <div className="rounded-xl border bg-white p-12 text-center">
                                    <Table
                                        size={50}
                                        className="mx-auto mb-3 text-slate-300"
                                    />
                                    <h2 className="text-lg font-semibold">
                                        Nenhuma Tabela encontrado
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        Não existem tabela neste banco de dados ou a pesquisa não retornou resultados.
                                    </p>
                                </div>
                            )}
                            {/* Tabela */}
                            {!loading && filtered_tables.length > 0 && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Nome
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    engine
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Linhas
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    CharSet
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Tamanho
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_tables.map(db => (
                                                <tr
                                                    key={db.database}
                                                    className="border-t hover:bg-slate-50 transition"
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <Table
                                                                size={16}
                                                                className="text-blue-600"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.engine}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                                            {db.totalRows}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.collation}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.size_mb} MB
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "functions" && (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    placeholder="Pesquisar Funções..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-80 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={loadTables}
                                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 transition"
                                >
                                    Atualizar
                                </button>
                            </div>
                            {/* Loading */}
                            {loading && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                {[
                                                    "Nome",
                                                    "Tipo de Rotina",
                                                    "Ultima Alteração",
                                                    "Retorna",
                                                    "created",
                                                    "Definer"
                                                ].map(col => (
                                                    <th
                                                        key={col}
                                                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 8 }).map((_, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t"
                                                >
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <td
                                                            key={i}
                                                            className="px-4 py-4"
                                                        >
                                                            <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Sem resultados */}
                            {!loading && filtered_functions.length === 0 && (
                                <div className="rounded-xl border bg-white p-12 text-center">
                                    <SquareFunction
                                        size={50}
                                        className="mx-auto mb-3 text-slate-300"
                                    />
                                    <h2 className="text-lg font-semibold">
                                        Nenhuma Frunção encontrado
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        Não existem funções neste banco de dados ou a pesquisa não retornou resultados.
                                    </p>
                                </div>
                            )}
                            {/* Tabela */}
                            {!loading && filtered_functions.length > 0 && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Nome
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Tipo de Rotina
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Ultima Alteração
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Retorna
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    DEFINER
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    CREATE
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_functions.map(db => (
                                                <tr
                                                    key={db.database}
                                                    className="border-t hover:bg-slate-50 transition"
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <SquareFunction
                                                                size={16}
                                                                className="text-blue-600"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.ROUTINE_TYPE}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                                            {db.LAST_ALTERED}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.returns}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.DEFINER}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.CREATED}
                                                    </td>
                                                    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {tab === "triggers" && (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    placeholder="Pesquisar Funções..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-80 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={loadTables}
                                    className="rounded-lg border font-white-800 border-blue-300 bg-blue-500 px-4 py-2 hover:bg-blue-800 transition"
                                >
                                    Adicionar Trigger
                                </button>
                                <button
                                    onClick={loadTables}
                                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 transition"
                                >
                                    Atualizar
                                </button>
                            </div>
                            {/* Loading */}
                            {loading && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                {[
                                                    "Nome",
                                                    "Tipo de Rotina",
                                                    "Ultima Alteração",
                                                    "Retorna",
                                                    "created",
                                                    "Definer"
                                                ].map(col => (
                                                    <th
                                                        key={col}
                                                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 8 }).map((_, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t"
                                                >
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <td
                                                            key={i}
                                                            className="px-4 py-4"
                                                        >
                                                            <div className="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Sem resultados */}
                            {!loading && filtered_triggers.length === 0 && (
                                <div className="rounded-xl border bg-white p-12 text-center">
                                    <AlarmCheckIcon
                                        size={50}
                                        className="mx-auto mb-3 text-slate-300"
                                    />
                                    <h2 className="text-lg font-semibold">
                                        Nenhuma Trigger encontrado
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        Não existem triggers neste banco de dados ou a pesquisa não retornou resultados.
                                    </p>
                                </div>
                            )}
                            {/* Tabela */}
                            {!loading && filtered_triggers.length > 0 && (
                                <div className="overflow-hidden rounded-xl border bg-white">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Nome
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Timing
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    Event
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    TableName
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    DEFINER
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    CREATE
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered_triggers.map(db => (
                                                <tr
                                                    key={db.database}
                                                    className="border-t hover:bg-slate-50 transition"
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <AlarmCheckIcon
                                                                size={16}
                                                                className="text-blue-600"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {db.timing}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                                            {db.event}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.tableName}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.DEFINER}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {db.CREATED}
                                                    </td>
                                                    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {tab === "sql" && (
                        <div className="space-y-5">

                            {/* Snippets */}

                            <div className="flex flex-wrap gap-2">

                                {snippets.map(snippet => (

                                    <button
                                        key={snippet.nome}
                                        onClick={() => setSql(snippet.sql)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                                    >
                                        {snippet.nome}
                                    </button>

                                ))}

                            </div>

                            {/* Editor */}

                            <textarea
                                value={sql}
                                onChange={(e) => {
                                    setSql(e.target.value)
                                    setSqlPage(1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === "Enter") {
                                        executeSQL(page);
                                    }
                                }}
                                spellCheck={false}
                                placeholder="Digite seu SQL aqui..."
                                className="h-26 w-full rounded-lg border border-slate-300 bg-white-950 p-4 font-mono text-sm text-black-300 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex gap-3">

                                <button
                                    onClick={() => executeSQL(page)}
                                    disabled={sqlLoading}
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {sqlLoading ? "Executando..." : "Executar (Ctrl+Enter)"}
                                </button>

                                <button
                                    onClick={() => {
                                        setSql("");
                                        setSqlResult(null);
                                    }}
                                    className="rounded-lg border border-slate-300 px-5 py-2 hover:bg-slate-100"
                                >
                                    Limpar
                                </button>

                            </div>

                            {/* Resultado */}

                            {sqlResult && (

                                <div className="rounded-xl border bg-white overflow-hidden">

                                    <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">

                                        <span className="font-medium">
                                            Resultado
                                        </span>

                                        {sqlResult.rowsSize && (
                                            <div className="flex items-center justtify-between gap-2">
                                                <button
                                                    disabled={sqlLoading || page <= 1}
                                                    onClick={() => executeSQL(page - 1)}
                                                    className="disabled:opacity-50"
                                                >
                                                    <ArrowLeft size={20}/>
                                                </button>
                                                <span className="text-sm text-slate-500">
                                                    Página {sqlResult.rowsSize[0]} • Mais {sqlResult.rowsSize[1]} página(s)
                                                </span>
                                                <button
                                                    disabled={
                                                        sqlLoading ||
                                                        page >= sqlResult.rowsSize[1]
                                                    }
                                                    onClick={() => executeSQL(page + 1)}
                                                    className="disabled:opacity-50"
                                                >
                                                    <ArrowRight size={20}/>
                                                </button>
                                            </div>
                                        )}

                                    </div>

                                    {sqlResult.rows.length === 0 ? (

                                        <div className="p-10 text-center text-slate-500">
                                            A consulta não retornou registros.
                                        </div>

                                    ) : (

                                        <div className="overflow-auto max-h-[500px]">

                                            <table className="min-w-full text-sm">

                                                <thead className="sticky top-0 bg-slate-100">

                                                    <tr>

                                                        {sqlResult.columns.map(column => (

                                                            <th
                                                                key={column}
                                                                className="border-b px-4 py-3 text-left font-semibold whitespace-nowrap"
                                                            >
                                                                {column}
                                                            </th>

                                                        ))}

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {sqlResult.rows.map((row, rowIndex) => (

                                                        <tr
                                                            key={rowIndex}
                                                            className="border-b hover:bg-slate-50"
                                                        >

                                                            {row.map((value, columnIndex) => (

                                                                <td
                                                                    key={columnIndex}
                                                                    className="px-4 py-3 whitespace-nowrap"
                                                                >

                                                                    {value === null
                                                                        ? (
                                                                            <span className="italic text-slate-400">
                                                                                NULL
                                                                            </span>
                                                                        )
                                                                        : String(value)
                                                                    }

                                                                </td>

                                                            ))}

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
