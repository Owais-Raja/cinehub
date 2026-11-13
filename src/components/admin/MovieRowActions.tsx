"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowUpDown, Loader2, ExternalLink } from "lucide-react";

interface MovieRowActionsProps {
  movieId: string;
  movieSlug: string;
  movieTitle: string;
  currentStatus: string;
}

export function MovieRowActions({
  movieId,
  movieSlug,
  movieTitle,
  currentStatus,
}: MovieRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    setLoading(true);
    const newStatus = currentStatus === "NOW_SHOWING" ? "COMING_SOON" : "NOW_SHOWING";
    try {
      const res = await fetch(`/api/movies/${movieId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      alert("Error updating status: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${movieTitle}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/movies/${movieId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete movie");
      router.refresh();
    } catch (err) {
      alert("Error deleting movie: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Toggle Theatrical Status */}
      <button
        onClick={handleToggleStatus}
        disabled={loading}
        title={currentStatus === "NOW_SHOWING" ? "Move to Coming Soon" : "Mark as In Theaters"}
        className="p-1.5 rounded-lg bg-[#242B3A] text-[#8E9AA8] hover:text-[#E8B86D] hover:bg-[#2D3748] border border-[#2D3748] text-xs transition-colors flex items-center gap-1"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">
          {currentStatus === "NOW_SHOWING" ? "Set Upcoming" : "Set In Theaters"}
        </span>
      </button>

      {/* View Live Customer Page */}
      <Link
        href={`/movies/${movieSlug}`}
        target="_blank"
        title="View customer page"
        className="p-1.5 rounded-lg bg-[#242B3A] text-[#8E9AA8] hover:text-white hover:bg-[#2D3748] border border-[#2D3748] text-xs transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      {/* Delete Movie */}
      <button
        onClick={handleDelete}
        disabled={loading}
        title="Delete movie"
        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 text-xs transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

