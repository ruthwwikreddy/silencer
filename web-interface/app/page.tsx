import LoggerDashboard from "./components/LoggerDashboard";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black font-sans text-gray-100">
      <main className="w-full max-w-4xl p-6 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
        <LoggerDashboard />
      </main>
    </div>
  );
}
