import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import { Film } from "lucide-react";

export interface MovieCardProps {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  durationMins: number;
  certification: string;
  genres: string[];
  availableFormats?: string[];
  availableLanguages?: string[];
}

export function MovieCard({
  title,
  slug,
  posterUrl,
  durationMins,
  certification,
  genres,
  availableFormats = [],
  availableLanguages = [],
}: MovieCardProps) {
  return (
    <div className="group flex flex-col bg-[#212836] rounded-xl overflow-hidden border border-[#2D3748] hover:border-[#E83B50] transition-all duration-300 hover:shadow-xl hover:shadow-[#E83B50]/10">
      {/* Poster Image Container */}
      <Link href={`/movies/${slug}`} className="relative aspect-[2/3] overflow-hidden bg-[#1E2430]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Fallback for failed image loads
            (e.target as HTMLElement).style.display = "none";
          }}
        />

        {/* Poster Fallback Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-[#8E9AA8]/30 -z-10">
          <Film className="w-16 h-16" />
        </div>

        {/* Certification Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white border border-white/20">
          {certification}
        </div>

        {/* Formats Overlay */}
        {availableFormats.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {availableFormats.map((fmt) => (
              <span
                key={fmt}
                className="px-1.5 py-0.5 rounded bg-[#171923]/90 text-[10px] font-semibold text-[#E8B86D] border border-[#E8B86D]/40"
              >
                {fmt}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Details Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <Link href={`/movies/${slug}`}>
            <h3 className="font-bold text-sm text-[#F4F3F0] group-hover:text-[#E83B50] line-clamp-1 transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-[11px] text-[#8E9AA8] mt-1 line-clamp-1">
            {genres.join(", ")}
          </p>
          <p className="text-[11px] text-[#8E9AA8] mt-0.5">
            {formatDuration(durationMins)}
            {availableLanguages.length > 0 && ` • ${availableLanguages.join(", ")}`}
          </p>
        </div>

        <Link
          href={`/movies/${slug}`}
          className="mt-3.5 w-full py-2 rounded-lg bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-semibold text-center transition-colors shadow-md shadow-[#E83B50]/20"
        >
          Book Tickets
        </Link>
      </div>
    </div>
  );
}

