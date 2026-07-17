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
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/icon-512.png"
                alt="dbManager"
                className="h-14 w-14"
              />
            </div>
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <svg
                className="h-10 w-10 animate-spin text-blue-600"
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
            </div>
            {/* Texto */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Validando sessão
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Aguarde enquanto verificamos suas credenciais...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}