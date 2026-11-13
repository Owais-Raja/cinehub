"use client";

import { useEffect, useState } from "react";
import { formatINR, formatTime, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Ticket, Film, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationResult, setCancellationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (res.ok) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? This will release your seats and simulate an instant refund.")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setErrorMsg(null);
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Cancellation failed");
      }

      setCancellationResult(data.data);
      await loadBookings();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#E83B50] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-semibold text-white">Loading Your Bookings...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-4 border-b border-[#2D3748] mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#E83B50]" />
            <span>My Bookings & Tickets</span>
          </h1>
          <p className="text-xs text-[#8E9AA8] mt-1">
            View active movie tickets, access digital QR passes, or cancel eligible bookings
          </p>
        </div>
      </div>

      {cancellationResult && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white">Booking Successfully Cancelled!</h4>
            <p className="mt-0.5">
              Ref: <span className="font-mono">{cancellationResult.bookingReference}</span> • Refund of{" "}
              <span className="font-bold">{formatINR(cancellationResult.refundAmount)}</span> simulated to original payment method.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isConfirmed = booking.status === "CONFIRMED";
            const isCancelled = booking.status === "CANCELLED";

            // Check 2 hour window
            const showTime = new Date(booking.show.startTime);
            const hoursLeft = (showTime.getTime() - Date.now()) / (1000 * 60 * 60);
            const canCancel = isConfirmed && hoursLeft >= 2;

            return (
              <div
                key={booking.id}
                className="bg-[#212836] rounded-2xl border border-[#2D3748] p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      {booking.show.movie.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : isCancelled
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#E8B86D]">
                    {booking.show.screen.theatre.name} ({booking.show.screen.name})
                  </p>

                  <p className="text-xs text-[#8E9AA8] flex items-center gap-2">
                    <span>{formatDate(booking.show.startTime)}</span>
                    <span>•</span>
                    <span>{formatTime(booking.show.startTime)}</span>
                    <span>•</span>
                    <span>{booking.show.format.name}</span>
                  </p>

                  <div className="pt-1 text-[11px] text-[#8E9AA8]">
                    <span>Ref: </span>
                    <span className="text-white font-mono font-bold">{booking.bookingReference}</span>
                    <span className="mx-2">•</span>
                    <span>Amount: </span>
                    <span className="text-white font-semibold">{formatINR(booking.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {booking.ticket && isConfirmed && (
                    <Link
                      href={`/booking/ticket/${booking.ticket.ticketReference}`}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-semibold text-center transition-colors shadow-md shadow-[#E83B50]/20"
                    >
                      View QR Ticket
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
                    >
                      {cancellingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  )}

                  {isConfirmed && !canCancel && (
                    <span className="text-[10px] text-[#8E9AA8] italic">
                      Non-cancellable (&lt;2h before show)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#212836] rounded-2xl border border-[#2D3748]">
          <Film className="w-12 h-12 text-[#8E9AA8] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-white">No Bookings Found</h3>
          <p className="text-xs text-[#8E9AA8] mt-1 mb-4">
            You have not booked any movie tickets yet.
          </p>
          <Link
            href="/movies"
            className="px-5 py-2.5 rounded-xl bg-[#E83B50] text-white text-xs font-bold"
          >
            Explore Now Showing
          </Link>
        </div>
      )}
    </div>
  );
}

