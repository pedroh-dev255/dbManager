"use client";

import { useState, useEffect } from "react";
import Sidebar from "./_components/Sidebar";
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
                ) : selected.type === "server" ? (
                    <ServerDetails server={selected.data} />
                ) : (
                    <DatabaseDetails database={selected.data} />
                )}
            </main>
        </div>
    );

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
    const [search, setSearch] = useState("");
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
        }
    ];

    useEffect(() => {
        loadDatabases();
    }, [server.id]);

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

    async function executeSQL() {
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
                    sql,
                }),
            });

            const data = await res.json();
            //console.log(data);

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

                                <button
                                    onClick={loadDatabases}
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
                                                    key={db.database}
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
                                onChange={(e) => setSql(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === "Enter") {
                                        executeSQL();
                                    }
                                }}
                                spellCheck={false}
                                placeholder="Digite seu SQL aqui..."
                                className="h-56 w-full rounded-lg border border-slate-300 bg-white-950 p-4 font-mono text-sm text-black-300 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex gap-3">

                                <button
                                    onClick={executeSQL}
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
                                            <span className="text-sm text-slate-500">
                                                Página {sqlResult.rowsSize[0]} • Mais {sqlResult.rowsSize[1]} página(s)
                                            </span>
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

function DatabaseDetails({ database }) {
    const [tab, setTab] = useState("tables");
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState([]);
    const [views, setViews] = useState([]);
    const [triggers, setTriggers] = useState([]);
    const [functions, setFunctions] = useState([]);
    const [search, setSearch] = useState("");

    const [sql, setSql] = useState("");
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
            sql: "SHOW PROCESSLIST;"
        },
        {
            nome: "DROP",
            sql: "SHOW VARIABLES;"
        },
        {
            nome: "CREATE",
            sql: "SHOW STATUS;"
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

    async function executeSQL() {
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
                    sql,
                }),
            });

            const data = await res.json();
            //console.log(data);

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
                                onChange={(e) => setSql(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === "Enter") {
                                        executeSQL();
                                    }
                                }}
                                spellCheck={false}
                                placeholder="Digite seu SQL aqui..."
                                className="h-56 w-full rounded-lg border border-slate-300 bg-white-950 p-4 font-mono text-sm text-black-300 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex gap-3">

                                <button
                                    onClick={executeSQL}
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
                                            <span className="text-sm text-slate-500">
                                                Página {sqlResult.rowsSize[0]} • Mais {sqlResult.rowsSize[1]} página(s)
                                            </span>
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