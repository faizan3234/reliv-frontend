import React from 'react';

export default function AppShell({
  children,
  title,
  subtitle,
  showLogo = true,
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
        {showLogo && (
          <header className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-sm">
              R
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                Reliv
              </p>
              <p className="text-xs text-slate-500">
                Secure Health & Care
              </p>
            </div>
          </header>
        )}

        {(title || subtitle) && (
          <section className="mb-6">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            )}
          </section>
        )}

        <section className="flex-1">
          {children}
        </section>

        <footer className="mt-8 pb-2 text-center text-xs text-slate-400">
          Secure payments powered by Razorpay
        </footer>
      </div>
    </main>
  );
}
