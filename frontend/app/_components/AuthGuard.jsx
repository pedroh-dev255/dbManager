'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login'];

export default function AuthGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/validate-token', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const validToken = res.ok && (await res.json()).success;
        console.log(validToken);
        // 🚧 Se estiver em rota pública e token for válido → manda pra "/"
        if (PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
          if (validToken) {
            router.replace('/');
            return;
          }
          if (mounted) setChecking(false);
          return;
        }

        // 🔒 Se não for rota pública e token for inválido → manda pra "/login"
        if (!validToken) {
          if (mounted) router.replace('/login');
          return;
        }

        if (mounted) setChecking(false);
      } catch (err) {
        console.error('Erro validando token:', err);
        if (mounted) router.replace('/login');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#09090B] flex items-center justify-center p-6">
        <div
          className="
            w-full max-w-lg
            rounded-3xl
            border border-zinc-200 dark:border-zinc-800
            bg-white dark:bg-[#111113]
            shadow-2xl
            p-10
            text-center
          "
        >
          {/* SPINNER */}
          <div
            className="
              mx-auto mb-6
              w-20 h-20
              rounded-3xl
              bg-zinc-100 dark:bg-zinc-900
              flex items-center justify-center
            "
          >
            <svg
              className="animate-spin h-10 w-10 text-emerald-500"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0 c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          {/* BUTTON */}
          <button
            // 🚧 Força o re-render do componente, disparando a validação do token novamente F5
            onClick={() => {
              console.log('Forçando revalidação da sessão...');
              window.location.reload()
            }}
            className="
              mt-6
              h-12 px-6
              rounded-2xl
              bg-emerald-500
              hover:bg-emerald-400
              transition-all
              text-black
              font-semibold
            "
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}