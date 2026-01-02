import ExpenseDashboard from "@/components/ExpenseDashboard";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 pb-20">
      <div className="absolute inset-x-0 top-[-40%] z-0 h-[480px] bg-gradient-to-b from-indigo-500/30 via-slate-900/60 to-slate-950 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10">
        <ExpenseDashboard />
      </div>
    </main>
  );
}
