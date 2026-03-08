import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = session.user as any;

  // Fetch recent renders
  const { data: renders } = await supabaseAdmin
    .from("renders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const hasSubscription = user.plan && user.plan !== "free";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-700">StageNZ</span>
        <div className="flex items-center gap-4">
          <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900">Account</Link>
          <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-900">Sign out</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {user.name?.split(" ")[0] || "there"}
            </p>
          </div>
          <Link
            href="/staging"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
          >
            New staging
          </Link>
        </div>

        {/* Usage card */}
        {hasSubscription ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-900 capitalize">{user.plan} plan</span>
                <p className="text-xs text-gray-400 mt-0.5">Resets monthly</p>
              </div>
              <Link href="/account" className="text-xs text-blue-700 hover:underline">Manage plan</Link>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-blue-700 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((user.rendersUsed / user.rendersLimit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {user.rendersUsed} of {user.rendersLimit === 999999 ? "unlimited" : user.rendersLimit} renders used
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">No active subscription</p>
              <p className="text-sm text-blue-700 mt-1">Choose a plan to start staging rooms</p>
            </div>
            <Link href="/#pricing" className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800">
              View plans
            </Link>
          </div>
        )}

        {/* Recent renders */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent stagings</h2>
        {!renders || renders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 mb-4">No stagings yet</p>
            <Link href="/staging" className="text-blue-700 text-sm font-medium hover:underline">
              Create your first staging
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renders.map((render: any) => (
              <div key={render.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {render.staged_url && (
                  <div className="relative h-48">
                    <Image src={render.staged_url} alt="Staged room" fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 capitalize">{render.room_type}</p>
                  <p className="text-xs text-gray-400 capitalize">{render.style} style</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      render.status === "completed" ? "bg-green-50 text-green-700" :
                      render.status === "processing" ? "bg-yellow-50 text-yellow-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {render.status}
                    </span>
                    {render.staged_url && (
                      <a href={render.staged_url} download className="text-xs text-blue-700 hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
