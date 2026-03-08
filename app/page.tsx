import Link from "next/link";
import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-700">StageNZ</span>
        <div className="flex items-center gap-4">
          <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</Link>
          <Link href="/login" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Built for NZ real estate agents
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Virtual staging that sells homes faster
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Upload a photo of an empty room, choose a style, and get a professionally staged result in under 30 seconds. No designers, no delays.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-800 transition"
        >
          Try free today
        </Link>
        <p className="text-sm text-gray-400 mt-4">No credit card required to sign up</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Upload your photo", desc: "Take a photo of the empty room on your phone or camera and upload it." },
              { step: "2", title: "Choose a style", desc: "Pick from modern, Scandinavian, Hamptons, industrial, and more." },
              { step: "3", title: "Download and use", desc: "Your staged photo is ready in seconds. Download and add straight to your listing." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">30s</div>
            <div className="text-gray-500">Average render time</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">2x</div>
            <div className="text-gray-500">Faster time to close</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">+47%</div>
            <div className="text-gray-500">More time spent on listing</div>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>StageNZ is a product of WebReach Limited, New Zealand</p>
      </footer>
    </div>
  );
}
