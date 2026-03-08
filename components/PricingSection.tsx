"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS } from "@/lib/stripe";

export function PricingSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePlanClick(planKey: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(planKey);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple pricing</h2>
        <p className="text-center text-gray-500 mb-12">Cancel any time. No lock-in contracts.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-white rounded-2xl p-8 shadow-sm border-2 ${key === "pro" ? "border-blue-700" : "border-transparent"}`}
            >
              {key === "pro" && (
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Most popular</div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                ${plan.price}<span className="text-base font-normal text-gray-400">/mo</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                {plan.renders === 999999 ? "Unlimited renders" : `${plan.renders} renders per month`}
              </p>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanClick(key)}
                disabled={loading === key}
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
                  key === "pro"
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {loading === key ? "Loading..." : "Get started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
