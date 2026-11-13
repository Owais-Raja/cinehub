import { MovieService } from "@/services/movie.service";
import { formatDuration } from "@/lib/utils";
import { Film, Plus, Edit } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const { movies } = await MovieService.getMovies({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D3748]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-[#E83B50]" />
            <span>Movie Catalog Management</span>
          </h1>
          <p className="text-xs text-[#8E9AA8] mt-0.5">
            Configure titles, certifications, genres, poster assets, and screening statuses
          </p>
        </div>
      </div>

      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2D3748] text-[#8E9AA8] bg-[#1E2430]">
                <th className="py-3 px-4 font-semibold">Movie</th>
                <th className="py-3 px-4 font-semibold">Rating</th>
                <th className="py-3 px-4 font-semibold">Runtime</th>
                <th className="py-3 px-4 font-semibold">Genres</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]/50">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-[#1E2430]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-8 h-12 object-cover rounded bg-[#171923]"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{movie.title}</h4>
                        <span className="text-[10px] text-[#8E9AA8] font-mono">{movie.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-[#E8B86D] font-bold">
                      {movie.certification}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{formatDuration(movie.durationMins)}</td>
                  <td className="py-3 px-4 text-[#8E9AA8]">{movie.genres.join(", ")}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {movie.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/movies/${movie.slug}`}
                      className="px-3 py-1 rounded-lg bg-[#242B3A] text-[#8E9AA8] hover:text-white border border-[#2D3748] text-xs font-semibold"
                    >
                      View Live
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

