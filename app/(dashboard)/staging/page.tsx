"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const ROOM_TYPES = ["Living Room", "Bedroom", "Dining Room", "Kitchen", "Office", "Bathroom", "Balcony", "Garden", "Swimming Pool"];
const STYLES = ["Modern", "Scandinavian", "Transitional", "Rustic", "Mid-Century Modern", "Urban Industrial", "Farmhouse", "Coastal", "Traditional", "Modern Organic", "Hamptons", "Minimalist", "Luxury"];

export default function StagingPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("Living Room");
  const [style, setStyle] = useState("Modern");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ originalUrl: string; stagedUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("roomType", roomType);
    formData.append("style", style);

    try {
      const res = await fetch("/api/stage", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult({ originalUrl: data.originalUrl, stagedUrl: data.stagedUrl });
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  const atLimit = user?.rendersUsed >= user?.rendersLimit;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-blue-700">StageNZ</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">Back to dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New staging</h1>
        <p className="text-gray-500 text-sm mb-8">Upload a photo of an empty room and we'll stage it for you.</p>

        {atLimit && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-sm text-orange-800">
            You have used all your renders this month.{" "}
            <Link href="/account" className="font-semibold underline">Upgrade your plan</Link> to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              preview ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative h-64 rounded-xl overflow-hidden">
                <Image src={preview} alt="Preview" fill className="object-contain" />
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">🏠</div>
                <p className="text-gray-600 font-medium">Drop your photo here or click to upload</p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>

          {/* Room type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room type</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoomType(r)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium capitalize border transition ${
                    roomType === r
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium capitalize border transition ${
                    style === s
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={!file || loading || atLimit}
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Staging your room..." : "Stage this room"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your staged room is ready</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Before</p>
                <div className="relative h-56 rounded-xl overflow-hidden">
                  <Image src={result.originalUrl} alt="Original" fill className="object-cover" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">After</p>
                <div className="relative h-56 rounded-xl overflow-hidden">
                  <Image src={result.stagedUrl} alt="Staged" fill className="object-cover" />
                </div>
              </div>
            </div>
            <a
              href={result.stagedUrl}
              download
              className="mt-4 inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition"
            >
              Download staged photo
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
