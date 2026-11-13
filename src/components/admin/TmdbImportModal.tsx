"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Sparkles, Search, Download, Loader2, X, Star } from "lucide-react";

interface TmdbResult {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  voteAverage: number;
}

export function TmdbImportModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const fetchNowPlaying = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tmdb/now-playing?region=IN");
      const data = await res.json();
      setResults(data.movies || []);
    } catch {
      setMessage("Failed to load now playing movies.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.movies || []);
      if ((data.movies || []).length === 0) {
        setMessage("No movies found matching your search.");
      }
    } catch {
      setMessage("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (tmdbId: number) => {
    setImportingId(tmdbId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/movies/import-tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setMessage(`Success! "${data.movie.title}" has been imported into CineHub.`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import movie";
      setMessage(`Error: ${msg}`);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          fetchNowPlaying();
        }}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E83B50] to-[#E8B86D] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#E83B50]/20 flex items-center gap-2 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>Import from TMDb (Live API)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1F2C] border border-[#2D3748] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-[#2D3748] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#E8B86D]" />
                  <span>Real-Time TMDb Movie Importer</span>
                </h3>
                <p className="text-xs text-[#8E9AA8] mt-0.5">
                  Search live global & Indian releases to import high-res posters, runtimes, and certifications
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#8E9AA8] hover:text-white hover:bg-[#242B3A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Quick Filter */}
            <div className="p-4 sm:p-6 border-b border-[#2D3748]/60 bg-[#161A24]">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9AA8]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search any title (e.g., Pushpa 2, Dune 3, Doomsday, King)..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#212836] border border-[#2D3748] text-white text-xs placeholder:text-[#8E9AA8] focus:outline-none focus:border-[#E83B50]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={fetchNowPlaying}
                  disabled={loading}
                  className="px-3 py-2.5 rounded-xl bg-[#242B3A] hover:bg-[#2D3748] text-white text-xs font-semibold border border-[#2D3748]"
                >
                  India Now Playing
                </button>
              </form>

              {message && (
                <div className="mt-3 p-2.5 rounded-xl bg-[#212836] border border-[#2D3748] text-xs text-center text-[#E8B86D] font-medium">
                  {message}
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loading ? (
                <div className="py-16 text-center text-[#8E9AA8]">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#E83B50]" />
                  <p className="text-xs">Fetching live data from TMDb API...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex gap-3 p-3 rounded-xl bg-[#212836] border border-[#2D3748] hover:border-[#8E9AA8]/40 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={movie.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded-lg bg-[#161A24] flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                            <span className="flex items-center gap-0.5 text-[10px] text-[#E8B86D] font-bold">
                              <Star className="w-3 h-3 fill-[#E8B86D]" />
                              {movie.voteAverage}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8E9AA8]">{movie.releaseDate || "Upcoming"}</p>
                          <p className="text-[10px] text-[#F4F3F0]/70 line-clamp-2 mt-1">
                            {movie.overview || "No overview available."}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#2D3748]/50 flex justify-end">
                          <button
                            onClick={() => handleImport(movie.id)}
                            disabled={importingId === movie.id}
                            className="px-3 py-1 rounded-lg bg-[#E83B50]/15 hover:bg-[#E83B50] text-[#E83B50] hover:text-white border border-[#E83B50]/40 text-[11px] font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {importingId === movie.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Importing...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                <span>Import to CineHub</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[#8E9AA8] text-xs">
                  Search a movie title or click &quot;India Now Playing&quot; to fetch live releases.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

