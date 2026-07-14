"use client";

import { useState } from "react";

import Sidebar from "./_components/Sidebar";

import {
    Database,
    Server,
    HardDrive,
    Activity,
    Clock,
    CheckCircle2,
} from "lucide-react";

export default function Home() {

    const [selected, setSelected] = useState(null);

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

        <div className="p-8">

        </div>

    );
  }
