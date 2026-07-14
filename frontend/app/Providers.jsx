'use client';

import ToastProvider from './_components/ToastProvider';
import AuthGuard from './_components/AuthGuard';

export default function Providers({ children }) {
  return (
    <>
      <ToastProvider />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}