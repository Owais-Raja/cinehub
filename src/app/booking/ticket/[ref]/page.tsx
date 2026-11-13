"use client";

import { use, useEffect, useState } from "react";
import { formatINR, formatTime, formatDate } from "@/lib/utils";
import { CheckCircle2, Printer, Ticket, MapPin, Calendar, Clock, Film } from "lucide-react";
import Link from "next/link";

export default function TicketConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref: ticketRef } = use(params);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tickets/${ticketRef}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to load ticket");
        }

        setTicket(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketRef]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#E83B50] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-semibold text-white">Generating Digital QR Pass...</h2>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-base font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-[#8E9AA8] mt-1 mb-4">{error}</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-[#E83B50] text-white text-xs font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  const { booking } = ticket;
  const { show } = booking;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {/* Success Confirmation Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-xs text-[#8E9AA8] mt-1">
          Your digital ticket is ready. Present this QR code at the cinema entry gate.
        </p>
      </div>

      {/* Digital Ticket Card (Boarding Pass Style) */}
      <div className="bg-[#212836] rounded-3xl border border-[#2D3748] overflow-hidden shadow-2xl">
        {/* Cinema Brand Header */}
        <div className="bg-[#1A1F2C] p-5 border-b border-[#2D3748] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E83B50] flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight text-sm">
              CINE<span className="text-[#E83B50]">HUB</span> PASS
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              ticket.status === "ISSUED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : ticket.status === "USED"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-red-500/20 text-red-400 border border-red-500/40"
            }`}
          >
            {ticket.status === "ISSUED" ? "Valid Entry" : ticket.status}
          </span>
        </div>

        {/* Movie & Show Info */}
        <div className="p-6 border-b border-[#2D3748]/60 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {show.movie.title}
            </h2>
            <p className="text-xs text-[#E8B86D] font-semibold mt-0.5">
              {show.format.name} • {show.language.name} • {show.movie.certification}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#8E9AA8] block text-[11px]">Cinema & Screen</span>
              <p className="text-white font-medium mt-0.5">{show.screen.theatre.name}</p>
              <p className="text-[#8E9AA8] text-[11px]">{show.screen.name}</p>
            </div>

            <div>
              <span className="text-[#8E9AA8] block text-[11px]">Date & Time</span>
              <p className="text-white font-medium mt-0.5">{formatDate(show.startTime)}</p>
              <p className="text-[#8E9AA8] text-[11px]">{formatTime(show.startTime)}</p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[#8E9AA8] block text-[11px]">Reserved Seats</span>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {booking.bookingSeats.map((bs: any) => (
                <span
                  key={bs.id}
                  className="px-2.5 py-1 rounded-lg bg-[#E83B50]/15 text-[#E83B50] border border-[#E83B50]/30 font-bold text-xs"
                >
                  Row {bs.seat.row} - Seat {bs.seat.number} ({bs.category})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code Validation Section */}
        <div className="p-6 bg-[#1A1F2C] flex flex-col items-center text-center">
          <div className="bg-white p-3 rounded-2xl shadow-xl mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qrCodeData}
              alt="Gate Validation QR Code"
              className="w-48 h-48"
            />
          </div>

          <div className="font-mono text-xs text-[#8E9AA8]">
            <span>Ticket Ref: </span>
            <span className="text-white font-bold">{ticket.ticketReference}</span>
          </div>
          <div className="font-mono text-[11px] text-[#8E9AA8] mt-0.5">
            <span>Booking Ref: </span>
            <span className="text-white">{booking.bookingReference}</span>
          </div>

          <span className="text-[10px] text-[#8E9AA8] mt-3">
            Single-use cryptographic admission token. Tampering or copying is strictly audited.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => window.print()}
          className="flex-1 py-2.5 rounded-xl bg-[#242B3A] hover:bg-[#1E2430] text-white text-xs font-semibold border border-[#2D3748] flex items-center justify-center gap-2 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save Pass</span>
        </button>

        <Link
          href="/customer/bookings"
          className="flex-1 py-2.5 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-bold text-center shadow-lg shadow-[#E83B50]/30 transition-all"
        >
          View in My Bookings
        </Link>
      </div>
    </div>
  );
}
