import { useAuth } from '../context/AuthContext';

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-5 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold capitalize text-indigo-700">{user.role} account</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Welcome, {user.name}</h1>
      </section>
    </main>
  );
}
