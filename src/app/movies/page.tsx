import { MovieService } from "@/services/movie.service";
import { MovieCard } from "@/components/customer/MovieCard";
import Link from "next/link";
import { Film, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    genre?: string;
    language?: string;
    city?: string;
    status?: "NOW_SHOWING" | "COMING_SOON";
  }>;
}) {
  const { search, genre, language, city, status } = await searchParams;

  const { movies, pagination } = await MovieService.getMovies({
    search,
    genreSlug: genre,
    languageCode: language,
    citySlug: city,
    status,
    limit: 16,
  });

  const genres = [
    { name: "All Genres", slug: "" },
    { name: "Action", slug: "action" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Drama", slug: "drama" },
    { name: "Thriller", slug: "thriller" },
    { name: "Comedy", slug: "comedy" },
    { name: "Horror", slug: "horror" },
  ];

  const languages = [
    { name: "All Languages", code: "" },
    { name: "Hindi", code: "hi" },
    { name: "English", code: "en" },
    { name: "Telugu", code: "te" },
    { name: "Tamil", code: "ta" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Film className="w-6 h-6 text-[#E83B50]" />
              <span>{status === "COMING_SOON" ? "Upcoming Movies" : "Movies In Cinemas"}</span>
            </h1>
            <p className="text-xs text-[#8E9AA8] mt-1">
              {status === "COMING_SOON"
                ? "Anticipated upcoming Indian & international blockbusters coming soon to theaters"
                : "Browse real-time releases currently screening across top Indian multiplexes"}
            </p>
          </div>

          {/* BookMyShow Style Status Toggle Tabs */}
          <div className="flex items-center gap-1 bg-[#212836] p-1 rounded-xl border border-[#2D3748] self-start sm:self-auto">
            <Link
              href={`/movies?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(genre ? { genre } : {}),
                ...(language ? { language } : {}),
                status: "NOW_SHOWING",
              }).toString()}`}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                status !== "COMING_SOON"
                  ? "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/20"
                  : "text-[#8E9AA8] hover:text-white"
              }`}
            >
              In Cinemas
            </Link>

            <Link
              href={`/movies?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(genre ? { genre } : {}),
                ...(language ? { language } : {}),
                status: "COMING_SOON",
              }).toString()}`}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                status === "COMING_SOON"
                  ? "bg-[#E8B86D] text-[#171923] shadow-md shadow-[#E8B86D]/20"
                  : "text-[#8E9AA8] hover:text-white"
              }`}
            >
              Coming Soon
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2D3748]">
          <span className="text-xs font-semibold text-[#8E9AA8] flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </span>

          {genres.map((g) => (
            <Link
              key={g.slug}
              href={`/movies?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(language ? { language } : {}),
                ...(g.slug ? { genre: g.slug } : {}),
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                (genre === g.slug || (!genre && !g.slug))
                  ? "bg-[#E83B50] text-white"
                  : "bg-[#242B3A] text-[#8E9AA8] hover:text-white"
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {languages.map((l) => (
            <Link
              key={l.code}
              href={`/movies?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(genre ? { genre } : {}),
                ...(l.code ? { language: l.code } : {}),
              }).toString()}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                (language === l.code || (!language && !l.code))
                  ? "bg-[#E8B86D] text-[#171923] font-bold"
                  : "bg-[#242B3A] text-[#8E9AA8] hover:text-white"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#212836] rounded-2xl border border-[#2D3748] p-6">
          <Film className="w-12 h-12 text-[#8E9AA8] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white">
            {status === "COMING_SOON" ? "No Upcoming Releases Yet" : "No Movies In Theaters"}
          </h3>
          <p className="text-xs text-[#8E9AA8] mt-1 mb-4 max-w-sm mx-auto">
            {status === "COMING_SOON"
              ? "All upcoming movies have been cleared. Admin can upload upcoming titles anytime."
              : "All previous movies have been cleared. Log in as Admin to upload thumbnails and publish new releases."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/admin/movies"
              className="px-4 py-2 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-bold shadow-lg shadow-[#E83B50]/20"
            >
              Admin: Upload Movie
            </Link>
            <Link
              href="/movies"
              className="px-4 py-2 rounded-xl bg-[#242B3A] hover:bg-[#2D3748] text-[#8E9AA8] hover:text-white text-xs font-semibold border border-[#2D3748]"
            >
              Reset Filters
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

