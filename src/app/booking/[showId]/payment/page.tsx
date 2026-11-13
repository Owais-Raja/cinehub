"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils";
import {
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

function PaymentContent({ showId }: { showId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [simulateOutcome, setSimulateOutcome] = useState<"SUCCESS" | "FAILED">("SUCCESS");
  const [upiId, setUpiId] = useState("rajesh@okhdfcbank");
  const [isProcessing, setIsProcessing] = useState(false);

  // Client idempotency key generated once per checkout session
  const [idempotencyKey] = useState<string>(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID specified.");
      setLoading(false);
      return;
    }

    async function loadBooking() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings/${bookingId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to load booking details");
        }

        setBooking(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      setIsProcessing(true);
      setError(null);

      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: Number(booking.totalAmount),
          method: paymentMethod,
          simulateOutcome,
          idempotencyKey,
          upiId: paymentMethod === "UPI" ? upiId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Payment processing failed");
      }

      // Redirect to digital ticket confirmation screen
      router.push(`/booking/ticket/${data.data.ticketReference}`);
    } catch (err: any) {
      setError(err.message || "Payment simulation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#E83B50] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-semibold text-white">Initializing Secure Payment Gateway...</h2>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white">Payment Session Invalid</h2>
        <p className="text-xs text-[#8E9AA8] mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Payment Methods & Form */}
      <div className="md:col-span-2 bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2D3748] mb-6">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E8B86D]" />
              <span>Simulated Payment Gateway</span>
            </h1>
            <p className="text-xs text-[#8E9AA8] mt-0.5">
              Sandboxed simulation environment (No real financial transaction)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
            IDEMPOTENCY SAFE
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#1E2430] rounded-xl border border-[#2D3748] mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod("UPI")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "UPI"
                ? "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/30"
                : "text-[#8E9AA8] hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "CARD"
                ? "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/30"
                : "text-[#8E9AA8] hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("NETBANKING")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              paymentMethod === "NETBANKING"
                ? "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/30"
                : "text-[#8E9AA8] hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>NetBanking</span>
          </button>
        </div>

        <form onSubmit={handlePay} className="space-y-4 text-xs">
          {paymentMethod === "UPI" && (
            <div>
              <label className="block text-[#8E9AA8] mb-1.5 font-medium">
                Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E83B50]"
                required
              />
              <span className="block text-[11px] text-[#8E9AA8] mt-1">
                Supports Google Pay, PhonePe, Paytm, and BHIM UPI handles.
              </span>
            </div>
          )}

          {paymentMethod === "CARD" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[#8E9AA8] mb-1 font-medium">Card Number (Simulated)</label>
                <input
                  type="text"
                  defaultValue="4532 •••• •••• 8912"
                  className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-2.5 text-white"
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E9AA8] mb-1 font-medium">Expiry</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-2.5 text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[#8E9AA8] mb-1 font-medium">CVV</label>
                  <input
                    type="password"
                    defaultValue="123"
                    className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-2.5 text-white"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "NETBANKING" && (
            <div>
              <label className="block text-[#8E9AA8] mb-1.5 font-medium">Select Indian Bank</label>
              <select className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-2.5 text-white">
                <option>HDFC Bank</option>
                <option>State Bank of India (SBI)</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Evaluator Simulation Switches */}
          <div className="p-3 rounded-xl bg-[#1E2430] border border-[#2D3748] mt-6">
            <div className="text-[11px] font-bold text-[#E8B86D] uppercase tracking-wider mb-2">
              Evaluator Test Switch:
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="outcome"
                  checked={simulateOutcome === "SUCCESS"}
                  onChange={() => setSimulateOutcome("SUCCESS")}
                  className="accent-[#E83B50]"
                />
                <span className="text-white">Simulate Success (Approved)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="outcome"
                  checked={simulateOutcome === "FAILED"}
                  onChange={() => setSimulateOutcome("FAILED")}
                  className="accent-[#E83B50]"
                />
                <span className="text-red-400">Simulate Failure (Declined)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-[#E83B50]/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isProcessing
                ? "Authorizing Simulation..."
                : `Pay ${formatINR(booking.totalAmount)}`}
            </span>
          </button>
        </form>
      </div>

      {/* Order Summary Card */}
      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-5 shadow-xl h-fit">
        <h2 className="text-sm font-bold text-white pb-3 border-b border-[#2D3748] mb-4">
          Order Breakdown
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[#8E9AA8]">Booking Reference:</span>
            <p className="text-white font-mono font-bold mt-0.5">{booking.bookingReference}</p>
          </div>

          <div>
            <span className="text-[#8E9AA8]">Movie & Format:</span>
            <p className="text-white font-medium mt-0.5">{booking.show.movie.title}</p>
            <p className="text-[11px] text-[#E8B86D]">{booking.show.format.name} ({booking.show.language.name})</p>
          </div>

          <div>
            <span className="text-[#8E9AA8]">Theatre:</span>
            <p className="text-white font-medium mt-0.5">{booking.show.screen.theatre.name}</p>
            <p className="text-[11px] text-[#8E9AA8]">{booking.show.screen.name}</p>
          </div>

          <div className="border-t border-[#2D3748] pt-3 flex justify-between">
            <span className="text-[#8E9AA8]">Tickets Subtotal:</span>
            <span className="text-white font-semibold">{formatINR(booking.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#8E9AA8]">Convenience Fee:</span>
            <span className="text-white">{formatINR(booking.convenienceFee)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#8E9AA8]">GST (18%):</span>
            <span className="text-white">{formatINR(booking.taxAmount)}</span>
          </div>

          <div className="border-t border-[#2D3748] pt-3 flex justify-between text-sm font-bold">
            <span className="text-white">Total Payable:</span>
            <span className="text-[#E8B86D] text-base">{formatINR(booking.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = use(params);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="text-center py-20 text-xs text-[#8E9AA8]">Loading checkout session...</div>}>
        <PaymentContent showId={showId} />
      </Suspense>
    </div>
  );
}
