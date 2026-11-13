"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Film, X, Loader2, Upload, Sparkles } from "lucide-react";

const PRESET_POSTERS = [
  {
    name: "Action Blockbuster",
    url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
  },
  {
    name: "Sci-Fi / Space",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
  },
  {
    name: "Thriller / Crime",
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80",
  },
  {
    name: "Comedy / Family",
    url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&q=80",
  },
];

export function CreateMovieModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");
  const [certification, setCertification] = useState("UA");
  const [durationMins, setDurationMins] = useState(150);
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [synopsis, setSynopsis] = useState("");
  const [posterUrl, setPosterUrl] = useState(PRESET_POSTERS[0].url);
  const [bannerUrl, setBannerUrl] = useState(PRESET_POSTERS[0].banner);
  const [trailerUrl, setTrailerUrl] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPosterUrl(data.url);
      setBannerUrl(data.url);
    } catch (err) {
      alert("Image upload error: " + (err instanceof Error ? err.message : ""));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim()) {
      setError("Please provide a movie title and description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          synopsis: synopsis.trim(),
          durationMins: Number(durationMins) || 140,
          certification,
          status,
          releaseDate: new Date(releaseDate).toISOString(),
          posterUrl: posterUrl.trim(),
          bannerUrl: bannerUrl.trim() || posterUrl.trim(),
          trailerUrl: trailerUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create movie");
      }

      // Success
      setIsOpen(false);
      setTitle("");
      setSynopsis("");
      setTrailerUrl("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add movie";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white font-bold text-xs shadow-lg shadow-[#E83B50]/20 flex items-center gap-2 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>Add New Movie</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1F2C] border border-[#2D3748] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#2D3748] flex items-center justify-between bg-[#161A24]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#E83B50]" />
                  <span>Admin Movie Upload</span>
                </h3>
                <p className="text-xs text-[#8E9AA8] mt-0.5">
                  Upload movie thumbnail, enter title, synopsis, and configure theatrical status
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#8E9AA8] hover:text-white hover:bg-[#242B3A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Title & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-white">Movie Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Pushpa 2: The Rule, Dune 3, King..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs placeholder:text-[#8E9AA8] focus:outline-none focus:border-[#E83B50]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white">Theatrical Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "NOW_SHOWING" | "COMING_SOON")}
                    className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs focus:outline-none focus:border-[#E83B50]"
                  >
                    <option value="NOW_SHOWING">In Theaters Now</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload Section */}
              <div className="space-y-2 p-3 rounded-xl bg-[#212836]/70 border border-[#2D3748]">
                <label className="text-xs font-semibold text-white flex items-center justify-between">
                  <span>Movie Thumbnail / Poster Image *</span>
                  <span className="text-[10px] text-[#8E9AA8]">Upload from device or enter URL</span>
                </label>

                <div className="flex gap-4 items-center">
                  {/* Thumbnail Live Preview */}
                  <div className="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden border border-[#2D3748] bg-[#161A24] flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* File Upload Button */}
                    <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#E8B86D]/50 bg-[#242B3A] hover:bg-[#2D3748] text-xs font-semibold text-[#E8B86D] cursor-pointer transition-colors">
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{uploadingImage ? "Uploading image..." : "Upload Image from Device"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input */}
                    <input
                      type="text"
                      required
                      value={posterUrl}
                      onChange={(e) => {
                        setPosterUrl(e.target.value);
                        setBannerUrl(e.target.value);
                      }}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#161A24] border border-[#2D3748] text-white text-xs font-mono placeholder:text-[#8E9AA8] focus:outline-none focus:border-[#E83B50]"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#8E9AA8]">Presets:</span>
                      {PRESET_POSTERS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setPosterUrl(preset.url);
                            setBannerUrl(preset.banner);
                          }}
                          className="px-2 py-0.5 rounded bg-[#161A24] hover:bg-[#2D3748] text-[#8E9AA8] hover:text-white text-[10px] border border-[#2D3748]"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description / Synopsis */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white">Movie Description / Synopsis *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed plot summary and details for audience..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs placeholder:text-[#8E9AA8] focus:outline-none focus:border-[#E83B50]"
                />
              </div>

              {/* Certification, Runtime, Release Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8E9AA8]">CBFC Rating</label>
                  <select
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs focus:outline-none focus:border-[#E83B50]"
                  >
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="U">U (Universal)</option>
                    <option value="A">A (Adults 18+)</option>
                    <option value="S">S (Special)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8E9AA8]">Runtime (Minutes)</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs focus:outline-none focus:border-[#E83B50]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8E9AA8]">Release Date</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs focus:outline-none focus:border-[#E83B50]"
                  />
                </div>
              </div>

              {/* YouTube Trailer */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8E9AA8]">YouTube Trailer URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs placeholder:text-[#8E9AA8] focus:outline-none focus:border-[#E83B50]"
                />
              </div>

              {/* Informative notice */}
              <div className="p-3 rounded-xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 flex items-center gap-2 text-[11px] text-[#E8B86D]">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>
                  Adding a movie in &quot;In Theaters Now&quot; will automatically provision showtimes across multiplex screens so customers can book tickets right away!
                </span>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-[#2D3748] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#242B3A] text-white text-xs font-medium hover:bg-[#2D3748] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white font-bold text-xs shadow-lg shadow-[#E83B50]/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save & Publish Movie</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
