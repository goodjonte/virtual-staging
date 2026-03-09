"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface Render {
  id: string;
  status: "processing" | "completed" | "failed";
  original_url: string;
  staged_url?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [renders, setRenders] = useState<Render[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing renders on mount
  useEffect(() => {
    loadRenders();
  }, []);

  // Poll processing renders every 4 seconds
  useEffect(() => {
    const hasProcessing = renders.some(r => r.status === "processing");
    if (hasProcessing) {
      pollingRef.current = setInterval(pollProcessing, 4000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [renders]);

  async function loadRenders() {
    try {
      const res = await fetch("/api/renders");
      if (res.ok) {
        const data = await res.json();
        setRenders(data);
      }
    } catch {}
  }

  async function pollProcessing() {
    const processing = renders.filter(r => r.status === "processing");
    if (!processing.length) return;

    const updated = await Promise.all(
      processing.map(async (r) => {
        try {
          const res = await fetch(`/api/stage/${r.id}`);
          if (res.ok) return await res.json() as Render;
        } catch {}
        return r;
      })
    );

    setRenders(prev =>
      prev.map(r => {
        const u = updated.find(u => u.id === r.id);
        return u || r;
      })
    );
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/stage", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok && data.renderId) {
        // Add to renders list immediately as processing
        const newRender: Render = {
          id: data.renderId,
          status: "processing",
          original_url: data.originalUrl,
        };
        setRenders(prev => [newRender, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;

    setUploading(true);
    // Upload all files concurrently
    await Promise.all(arr.map(uploadFile));
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  const processing = renders.filter(r => r.status === "processing");
  const completed = renders.filter(r => r.status === "completed");
  const failed = renders.filter(r => r.status === "failed");
  const atLimit = user?.plan && user?.rendersUsed >= user?.rendersLimit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-700">StageNZ</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
          <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900">Account</Link>
          <button onClick={() => signOut()} className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Usage bar */}
        {user?.plan && user.plan !== "free" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">{user.plan} plan</span>
                <span className="text-xs text-gray-400">{user.rendersUsed} / {user.rendersLimit === 999999 ? "unlimited" : user.rendersLimit} renders</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-700 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((user.rendersUsed / user.rendersLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <Link href="/#pricing" className="text-xs text-blue-700 hover:underline whitespace-nowrap">Upgrade</Link>
          </div>
        )}

        {!user?.plan || user.plan === "free" ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">No active subscription</p>
              <p className="text-sm text-blue-700 mt-1">Choose a plan to start staging rooms</p>
            </div>
            <Link href="/#pricing" className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800">View plans</Link>
          </div>
        ) : null}

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition mb-10 ${
            dragOver ? "border-blue-500 bg-blue-50" :
            uploading ? "border-blue-300 bg-blue-50" :
            atLimit ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" :
            "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
          onClick={() => !uploading && !atLimit && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading || atLimit}
          />
          {uploading ? (
            <div>
              <div className="flex justify-center mb-3">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
              </div>
              <p className="text-blue-700 font-medium">Uploading photos...</p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-3">📷</div>
              <p className="text-gray-700 font-medium">Drop room photos here or click to upload</p>
              <p className="text-gray-400 text-sm mt-1">Upload multiple photos at once, JPG or PNG</p>
            </div>
          )}
        </div>

        {/* Currently staging */}
        {processing.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              Currently staging ({processing.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {processing.map(render => (
                <div key={render.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="relative h-44 bg-gray-100">
                    {render.original_url && (
                      <Image src={render.original_url} alt="Original" fill className="object-cover opacity-60" />
                    )}
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Staging room...</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Processing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed */}
        {failed.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Failed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {failed.map(render => (
                <div key={render.id} className="bg-white rounded-2xl border border-red-100 overflow-hidden">
                  <div className="relative h-44 bg-gray-100">
                    {render.original_url && (
                      <Image src={render.original_url} alt="Original" fill className="object-cover opacity-40" />
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Failed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed renders */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Completed ({completed.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(render => (
                <div key={render.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                  <div className="relative h-44">
                    <Image src={render.staged_url!} alt="Staged" fill className="object-cover" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <a
                        href={render.staged_url}
                        download
                        className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                    <a href={render.staged_url} download className="text-xs text-blue-700 hover:underline">
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {renders.length === 0 && !uploading && (
          <div className="text-center text-gray-400 mt-4">
            <p>No stagings yet. Upload a photo above to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
