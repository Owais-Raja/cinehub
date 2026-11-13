import { MovieService } from "@/services/movie.service";
import { ShowService } from "@/services/show.service";
import { formatDuration, formatINR, formatTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, Calendar, Clock, MapPin, Play, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MovieDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; city?: string }>;
}) {
  const { slug } = await params;
  const { date: dateParam, city: cityParam } = await searchParams;

  let movie;
  try {
    movie = await MovieService.getMovieBySlug(slug);
  } catch {
    notFound();
  }

  // Selected date (defaults to today)
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  // Get grouped shows
  const groupedTheatres = await ShowService.getShowsForMovieAndCity({
    movieId: movie.id,
    citySlug: cityParam || "mumbai",
    date: selectedDate,
  });

  // Next 4 days for date tab navigation
  const dates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      dateString: d.toISOString().split("T")[0],
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      formattedDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });

  const currentDateString = selectedDate.toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Movie Hero Banner */}
      <section className="relative w-full h-[400px] overflow-hidden bg-[#1E2430]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover brightness-40 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171923] via-[#171923]/60 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end w-full">
            {/* Poster Card */}
            <div className="w-32 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl flex-shrink-0 bg-[#212836]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-[#E83B50] text-white text-[11px] font-bold">
                  {movie.certification}
                </span>
                <span className="text-xs text-[#8E9AA8] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(movie.durationMins)}
                </span>
                <span className="text-xs text-[#8E9AA8]">•</span>
                <span className="text-xs text-[#8E9AA8]">
                  {movie.genres.map((g) => g.genre.name).join(", ")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                {movie.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#F4F3F0]/80 line-clamp-2 max-w-3xl mb-4">
                {movie.synopsis}
              </p>

              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#242B3A]/90 hover:bg-[#242B3A] text-xs font-semibold text-[#E8B86D] border border-[#E8B86D]/30 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-[#E8B86D]" />
                  <span>Watch Trailer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Showtime Selection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Date Tabs */}
        <div className="flex items-center gap-2 border-b border-[#2D3748] pb-4 mb-6 overflow-x-auto">
          {dates.map((d) => (
            <Link
              key={d.dateString}
              href={`/movies/${slug}?date=${d.dateString}`}
              className={`flex flex-col items-center px-4 py-2 rounded-xl text-center min-w-[85px] transition-all ${
                currentDateString === d.dateString
                  ? "bg-[#E83B50] text-white font-bold shadow-md shadow-[#E83B50]/30"
                  : "bg-[#212836] text-[#8E9AA8] hover:text-white border border-[#2D3748]"
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider">{d.dayName}</span>
              <span className="text-sm font-bold">{d.formattedDate}</span>
            </Link>
          ))}
        </div>

        {/* Theatres & Shows List */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#E83B50]" />
            <span>Select Cinema & Showtime</span>
          </h2>

          {groupedTheatres.length > 0 ? (
            groupedTheatres.map((theatre) => (
              <div
                key={theatre.theatreId}
                className="bg-[#212836] rounded-2xl border border-[#2D3748] p-5 shadow-lg"
              >
                {/* Cinema Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-[#2D3748]/60 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-white">{theatre.theatreName}</h3>
                    <p className="text-xs text-[#8E9AA8] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#E8B86D]" />
                      {theatre.address}
                    </p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">M-Ticket / Food Available</span>
                </div>

                {/* Showtimes Grid */}
                <div className="flex flex-wrap gap-3">
                  {theatre.shows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/booking/${show.id}`}
                      className="group flex flex-col p-3 rounded-xl bg-[#1E2430] border border-[#2D3748] hover:border-[#E83B50] transition-all min-w-[130px]"
                    >
                      <span className="text-sm font-bold text-white group-hover:text-[#E83B50] transition-colors">
                        {formatTime(show.startTime)}
                      </span>
                      <span className="text-[10px] text-[#E8B86D] font-semibold mt-0.5">
                        {show.format} • {show.language}
                      </span>
                      <span className="text-[10px] text-[#8E9AA8] mt-1">
                        Starts {formatINR(show.basePrice)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[#212836] rounded-2xl border border-[#2D3748]">
              <Film className="w-10 h-10 text-[#8E9AA8] mx-auto mb-2 opacity-40" />
              <h3 className="text-sm font-semibold text-white">No Shows Scheduled for This Date</h3>
              <p className="text-xs text-[#8E9AA8] mt-1">
                Please check other dates or explore other movies.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

