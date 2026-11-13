import Link from "next/link";
import { MovieService } from "@/services/movie.service";
import { TmdbService } from "@/services/tmdb.service";
import { MovieCard } from "@/components/customer/MovieCard";
import { Film, Sparkles, ShieldCheck, Clock, Ticket, Star, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ movies: nowShowing }, tmdbData] = await Promise.all([
    MovieService.getMovies({
      status: "NOW_SHOWING",
      limit: 8,
    }),
    TmdbService.getNowPlaying(1, "IN").catch(() => ({ movies: [] })),
  ]);

  const featuredMovie = nowShowing[0];
  const tmdbTrending = tmdbData.movies.slice(0, 6);

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Showcase Banner */}
      {featuredMovie && (
        <section className="relative w-full h-[450px] sm:h-[500px] overflow-hidden bg-[#1E2430]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
            alt={featuredMovie.title}
            className="w-full h-full object-cover object-center brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171923] via-[#171923]/40 to-transparent" />

          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E83B50] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Trending Blockbuster
                </span>
                <span className="px-2 py-0.5 rounded bg-black/60 text-xs font-semibold text-[#E8B86D]">
                  {featuredMovie.certification}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
                {featuredMovie.title}
              </h1>

              <p className="text-sm sm:text-base text-[#F4F3F0]/80 line-clamp-2 mb-6">
                {featuredMovie.synopsis}
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href={`/movies/${featuredMovie.slug}`}
                  className="px-6 py-3 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white font-bold text-sm shadow-xl shadow-[#E83B50]/30 transition-all flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </Link>

                <Link
                  href="/movies"
                  className="px-5 py-3 rounded-xl bg-[#242B3A]/80 hover:bg-[#242B3A] text-white font-medium text-sm border border-[#2D3748] transition-colors"
                >
                  Explore All Movies
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust & Feature Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#212836] p-4 rounded-2xl border border-[#2D3748] shadow-lg">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#E83B50]/15 flex items-center justify-center text-[#E83B50] flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">10-Minute Seat Locks</h4>
              <p className="text-[11px] text-[#8E9AA8]">Exclusive concurrency guarantee with zero double-booking.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#E8B86D]/15 flex items-center justify-center text-[#E8B86D] flex-shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Digital QR Passes</h4>
              <p className="text-[11px] text-[#8E9AA8]">Single-use verifiable digital tickets at cinema turnstiles.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Simulated 100% Refunds</h4>
              <p className="text-[11px] text-[#8E9AA8]">Easy self-service cancellations up to 2 hours before show.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-[#E83B50]" />
              <span>Now Showing</span>
            </h2>
            <p className="text-xs text-[#8E9AA8] mt-1">
              Popular films screening across top multiplexes today
            </p>
          </div>

          <Link
            href="/movies"
            className="text-xs font-semibold text-[#E8B86D] hover:underline"
          >
            See All Movies →
          </Link>
        </div>

        {nowShowing.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#212836] rounded-2xl border border-[#2D3748]">
            <Film className="w-12 h-12 text-[#8E9AA8] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-white">No Movies Available</h3>
            <p className="text-xs text-[#8E9AA8] mt-1">Run database seed script to populate demo movies.</p>
          </div>
        )}
      </section>

      {/* Real-Time Indian Cinema Feed (TMDb) */}
      {tmdbTrending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>Trending Across India</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8B86D]/15 text-[#E8B86D] border border-[#E8B86D]/30 uppercase tracking-wider">
                    Live TMDb API
                  </span>
                </h2>
              </div>
              <p className="text-xs text-[#8E9AA8] mt-1">
                Real-time theatrical releases and audience ratings updated from The Movie Database
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {tmdbTrending.map((tm) => (
              <div
                key={tm.id}
                className="group flex flex-col bg-[#212836] rounded-xl overflow-hidden border border-[#2D3748] hover:border-[#E8B86D] transition-all hover:shadow-lg hover:shadow-[#E8B86D]/10"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-[#1E2430]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tm.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"}
                    alt={tm.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-bold text-[#E8B86D] flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-[#E8B86D]" />
                    <span>{tm.voteAverage}</span>
                  </div>
                </div>

                <div className="p-2.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-white text-xs truncate group-hover:text-[#E8B86D] transition-colors">
                      {tm.title}
                    </h3>
                    <p className="text-[10px] text-[#8E9AA8] mt-0.5">
                      {tm.releaseDate ? new Date(tm.releaseDate).getFullYear() : "Now In Theatres"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

