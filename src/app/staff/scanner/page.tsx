"use client";

import { useState } from "react";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Search, ShieldCheck } from "lucide-react";

export default function StaffScannerPage() {
  const [ticketReference, setTicketReference] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [errorResult, setErrorResult] = useState<any | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketReference.trim()) return;

    try {
      setIsValidating(true);
      setValidationResult(null);
      setErrorResult(null);

      const res = await fetch("/api/staff/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketReference: ticketReference.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorResult(data.error);
        setRecentScans((prev) => [
          {
            ref: ticketReference.trim(),
            status: "REJECTED",
            message: data.error?.message || "Validation failed",
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        return;
      }

      setValidationResult(data.data);
      setRecentScans((prev) => [
        {
          ref: data.data.ticketReference,
          status: "APPROVED",
          movie: data.data.movieTitle,
          seats: data.data.admittedSeats?.join(", "),
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setTicketReference("");
    } catch (err: any) {
      setErrorResult({ message: err.message || "Network error" });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D3748] mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              STAFF PORTAL
            </span>
            <span className="text-[10px] text-[#8E9AA8] font-mono">
              ACCEPTANCE TEST AT-4 VERIFIER
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#E8B86D]" />
            <span>Turnstile Ticket Validator</span>
          </h1>
          <p className="text-xs text-[#8E9AA8] mt-0.5">
            Scan QR code or enter ticket pass reference to verify authenticity and mark single-use entry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scanner Input Card */}
        <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#E83B50]" />
            <span>Gate Scan Entry</span>
          </h3>

          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label className="block text-xs text-[#8E9AA8] mb-1.5 font-medium">
                Ticket Reference / Validation Token
              </label>
              <input
                type="text"
                placeholder="e.g. TCK-2026-8912-X1"
                value={ticketReference}
                onChange={(e) => setTicketReference(e.target.value)}
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#E8B86D]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isValidating || !ticketReference.trim()}
              className="w-full py-3 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#E83B50]/30 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isValidating ? "Verifying..." : "Validate & Admit Ticket"}</span>
            </button>
          </form>

          {/* Verification Result Card */}
          {validationResult && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-300 animate-accordion-down">
              <div className="flex items-center gap-2.5 mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-sm text-white">ENTRY APPROVED</h4>
                  <p className="text-[11px] text-emerald-300">Ticket marked as USED in database</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-emerald-100 bg-[#171923]/60 p-3 rounded-xl border border-emerald-500/20">
                <p>
                  <span className="text-[#8E9AA8]">Movie: </span>
                  <span className="font-bold text-white">{validationResult.movieTitle}</span>
                </p>
                <p>
                  <span className="text-[#8E9AA8]">Auditorium: </span>
                  <span className="text-white">{validationResult.theatreName} ({validationResult.screenName})</span>
                </p>
                <p>
                  <span className="text-[#8E9AA8]">Seats: </span>
                  <span className="font-bold text-[#E8B86D]">{validationResult.admittedSeats?.join(", ")}</span>
                </p>
                <p className="text-[10px] text-[#8E9AA8] mt-1 pt-1 border-t border-emerald-500/20">
                  Admitted At: {new Date(validationResult.admittedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {/* Rejection / Duplicate Alert (AT-4 Verification) */}
          {errorResult && (
            <div className="mt-6 p-5 rounded-2xl bg-red-500/15 border-2 border-red-500/60 text-red-300 animate-accordion-down">
              <div className="flex items-center gap-2.5 mb-2">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-sm text-white">ENTRY REJECTED</h4>
                  <p className="text-[11px] text-red-400 font-mono">{errorResult.code || "VALIDATION_FAILED"}</p>
                </div>
              </div>

              <p className="text-xs text-red-200 mt-2 leading-relaxed bg-[#171923]/60 p-3 rounded-xl border border-red-500/20">
                {errorResult.message}
              </p>
            </div>
          )}
        </div>

        {/* Recent Validation History Table */}
        <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Recent Gate Scans</h3>
            <p className="text-xs text-[#8E9AA8] mb-4">
              Real-time audit log of admissions during this operator session.
            </p>

            {recentScans.length > 0 ? (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#1E2430] border border-[#2D3748] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{scan.ref}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            scan.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {scan.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                        {scan.movie ? `${scan.movie} • ${scan.seats}` : scan.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#8E9AA8] font-mono">{scan.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#8E9AA8] text-xs">
                No scans recorded yet in this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

