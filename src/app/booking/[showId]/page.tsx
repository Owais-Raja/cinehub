"use client";

import { useEffect, useState, use } from "react";
import { SeatMap, SeatItem } from "@/components/booking/SeatMap";
import { formatINR, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Film, MapPin, Clock, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BookingPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<any>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});

  // Summary Modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Fetch show availability
  useEffect(() => {
    async function loadAvailability() {
      try {
        setLoading(true);
        const res = await fetch(`/api/shows/${showId}/availability`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to load seat layout");
        }

        setShowInfo(data.data.show);
        setSeats(data.data.seats);
        setPricing(data.data.pricing);
      } catch (err: any) {
        setError(err.message || "Failed to load show details");
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [showId]);

  const handleProceedToSummary = (seatIds: string[], holdId?: string) => {
    if (!session) {
      router.push(`/login?callbackUrl=/booking/${showId}`);
      return;
    }
    setSelectedSeatIds(seatIds);
    if (holdId) setActiveHoldId(holdId);
    setShowSummaryModal(true);
  };

  const handleConfirmAndProceedToPay = async () => {
    if (!activeHoldId) return;

    try {
      setIsCreatingBooking(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          holdId: activeHoldId,
          seatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create booking");
      }

      router.push(`/booking/${showId}/payment?bookingId=${data.data.bookingId}`);
    } catch (err: any) {
      alert(err.message || "Booking creation failed");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#E83B50] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-semibold text-white">Loading Cinema Seat Map...</h2>
        <p className="text-xs text-[#8E9AA8] mt-1">Connecting to real-time reservation engine</p>
      </div>
    );
  }

  if (error || !showInfo) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">Unable to Load Show</h2>
        <p className="text-xs text-[#8E9AA8] mt-1 mb-4">{error}</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-[#E83B50] text-white text-xs font-semibold"
        >
          Return to Movies
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown for summary modal
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const convenienceFee = 30 * selectedSeats.length;
  const taxable = subtotal + convenienceFee;
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const grandTotal = Math.round((taxable + gst) * 100) / 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Show Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D3748] mb-8">
        <div>
          <Link
            href="/movies"
            className="inline-flex items-center gap-1 text-xs text-[#8E9AA8] hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Movies
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {showInfo.movieTitle}
          </h1>
          <p className="text-xs text-[#8E9AA8] flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[#E8B86D] font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              {showInfo.theatreName} ({showInfo.screenName})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(showInfo.startTime)}
            </span>
            <span>•</span>
            <span>{showInfo.format} ({showInfo.language})</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#242B3A] border border-[#2D3748] text-[#E8B86D] font-mono">
            Pessimistic Lock Active
          </span>
        </div>
      </div>

      {/* Interactive Seat Map */}
      <SeatMap
        showId={showId}
        seats={seats}
        pricing={pricing}
        onProceedToSummary={handleProceedToSummary}
      />

      {/* Booking Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#212836] border border-[#2D3748] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-accordion-down">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3748] mb-4">
              <h3 className="font-bold text-base text-white">Booking Summary</h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-[#8E9AA8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-[#8E9AA8]">Movie:</span>
                <span className="text-white font-medium">{showInfo.movieTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E9AA8]">Cinema:</span>
                <span className="text-white font-medium">{showInfo.theatreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E9AA8]">Seats:</span>
                <span className="text-[#E8B86D] font-bold">
                  {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                </span>
              </div>

              <div className="border-t border-[#2D3748] pt-3 flex justify-between">
                <span className="text-[#8E9AA8]">Tickets Subtotal:</span>
                <span className="text-white font-semibold">{formatINR(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8E9AA8]">Convenience Fee (₹30/seat):</span>
                <span className="text-white">{formatINR(convenienceFee)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8E9AA8]">GST (18% - CGST 9% + SGST 9%):</span>
                <span className="text-white">{formatINR(gst)}</span>
              </div>

              <div className="border-t border-[#2D3748] pt-3 flex justify-between text-sm font-bold">
                <span className="text-white">Total Payable Amount:</span>
                <span className="text-[#E8B86D] text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#242B3A] hover:bg-[#1E2430] text-[#8E9AA8] text-xs font-semibold border border-[#2D3748]"
              >
                Modify Seats
              </button>
              <button
                onClick={handleConfirmAndProceedToPay}
                disabled={isCreatingBooking}
                className="flex-1 py-2.5 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] text-white text-xs font-bold shadow-lg shadow-[#E83B50]/30 transition-all"
              >
                {isCreatingBooking ? "Reserving..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

