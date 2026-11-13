"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";
import { Check, Clock, AlertCircle } from "lucide-react";

export interface SeatItem {
  id: string;
  row: string;
  number: number;
  category: "SILVER" | "GOLD" | "PLATINUM" | "RECLINER";
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  isHeldByCurrentUser?: boolean;
}

interface SeatMapProps {
  showId: string;
  seats: SeatItem[];
  pricing: Record<string, number>;
  onProceedToSummary: (selectedSeatIds: string[], holdId?: string) => void;
  isHolding?: boolean;
}

export function SeatMap({
  showId,
  seats,
  pricing,
  onProceedToSummary,
  isHolding = false,
}: SeatMapProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);

  // Group seats by category and then by row
  const rowsMap = new Map<string, SeatItem[]>();
  for (const s of seats) {
    if (!rowsMap.has(s.row)) {
      rowsMap.set(s.row, []);
    }
    rowsMap.get(s.row)!.push(s);
  }

  // Sort seats in each row by number
  for (const [, rowSeats] of rowsMap.entries()) {
    rowSeats.sort((a, b) => a.number - b.number);
  }

  // Distinct sorted rows
  const sortedRows = Array.from(rowsMap.keys()).sort();

  // Tier groupings for visual headers
  const getRowCategory = (row: string) => {
    const firstSeat = rowsMap.get(row)?.[0];
    return firstSeat?.category || "SILVER";
  };

  const handleSeatClick = (seat: SeatItem) => {
    if (seat.status === "BOOKED" || (seat.status === "HELD" && !seat.isHeldByCurrentUser)) {
      return;
    }
    setErrorMsg(null);

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 10) {
        setErrorMsg("You can select a maximum of 10 seats per booking.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  // Hold Timer countdown
  useEffect(() => {
    if (holdTimer === null || holdTimer <= 0) return;
    const interval = setInterval(() => {
      setHoldTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setErrorMsg("Your seat hold lease has expired. Please reselect your seats.");
          setSelectedSeatIds([]);
          setActiveHoldId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [holdTimer]);

  const handleLockSeats = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMsg("Please select at least 1 seat to proceed.");
      return;
    }

    setIsLocking(true);
    setErrorMsg(null);

    try {
      // Call hold API to acquire row-level lock
      const sessionToken = `client-sess-${Date.now()}`;
      const res = await fetch(`/api/shows/${showId}/hold-seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatIds: selectedSeatIds,
          sessionToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to hold seats");
      }

      setActiveHoldId(data.data.holdId);
      setHoldTimer(data.data.remainingSeconds || 600);
      onProceedToSummary(selectedSeatIds, data.data.holdId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reserve selected seats. Please try again.");
    } finally {
      setIsLocking(false);
    }
  };

  // Calculate dynamic subtotal
  const selectedSeatsList = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeatsList.reduce((acc, s) => acc + s.price, 0);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-6 bg-[#212836] rounded-xl border border-[#2D3748] mb-8 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-[#2D3748] bg-[#1E2430]" />
          <span className="text-[#8E9AA8]">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#E83B50] flex items-center justify-center text-white">
            <Check className="w-3 h-3" />
          </div>
          <span className="text-white font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-amber-500 bg-amber-500/20 animate-pulse" />
          <span className="text-amber-400">Held (10m Lock)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#2D3748] text-[#8E9AA8] flex items-center justify-center">
            ✕
          </div>
          <span className="text-[#8E9AA8]">Booked</span>
        </div>
      </div>

      {/* Screen Direction Indicator */}
      <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
        <div className="w-3/4 h-3 rounded-t-full bg-gradient-to-b from-[#E83B50]/60 to-transparent shadow-lg shadow-[#E83B50]/20" />
        <div className="w-full border-t border-[#E83B50]/30 mt-1" />
        <span className="text-[10px] uppercase tracking-widest text-[#8E9AA8] mt-2 font-medium">
          Screen (All eyes this way please)
        </span>
      </div>

      {/* Error / Alert Banner */}
      {errorMsg && (
        <div className="w-full max-w-xl mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Seat Rows by Category */}
      <div className="w-full overflow-x-auto flex flex-col items-center py-4 px-2">
        <div className="flex flex-col gap-3 min-w-[500px]">
          {sortedRows.map((row, idx) => {
            const rowSeats = rowsMap.get(row) || [];
            const category = getRowCategory(row);
            const prevRow = sortedRows[idx - 1];
            const isCategoryChange = !prevRow || getRowCategory(prevRow) !== category;

            return (
              <React.Fragment key={row}>
                {/* Tier Price Header Divider */}
                {isCategoryChange && (
                  <div className="flex items-center gap-3 my-2 text-xs font-semibold text-[#8E9AA8] border-b border-[#2D3748] pb-1">
                    <span className="text-[#E8B86D] uppercase tracking-wider font-bold">
                      {category}
                    </span>
                    <span>•</span>
                    <span>{formatINR(pricing[category] || 250)}</span>
                  </div>
                )}

                {/* Individual Row */}
                <div className="flex items-center justify-center gap-2">
                  <span className="w-5 text-xs font-bold text-[#8E9AA8] text-right">
                    {row}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isHeld = seat.status === "HELD" && !seat.isHeldByCurrentUser;
                      const isBooked = seat.status === "BOOKED";
                      const isRecliner = seat.category === "RECLINER";

                      let seatClasses =
                        "transition-all duration-150 flex items-center justify-center font-bold text-[10px] ";

                      if (isRecliner) {
                        seatClasses += "w-8 h-8 rounded-md "; // Wider for recliners
                      } else {
                        seatClasses += "w-6 h-6 sm:w-7 sm:h-7 rounded ";
                      }

                      if (isSelected) {
                        seatClasses +=
                          "bg-[#E83B50] text-white shadow-md shadow-[#E83B50]/40 scale-105 cursor-pointer";
                      } else if (isBooked) {
                        seatClasses +=
                          "bg-[#242B3A] text-[#8E9AA8]/40 border border-[#2D3748] cursor-not-allowed";
                      } else if (isHeld) {
                        seatClasses +=
                          "bg-amber-500/20 text-amber-400 border border-amber-500/50 cursor-not-allowed animate-pulse";
                      } else {
                        // Available
                        if (isRecliner) {
                          seatClasses +=
                            "border border-[#E8B86D] bg-[#212836] text-[#E8B86D] hover:bg-[#E8B86D] hover:text-[#171923] cursor-pointer";
                        } else {
                          seatClasses +=
                            "border border-[#2D3748] bg-[#1E2430] text-[#F4F3F0] hover:border-[#E83B50] hover:bg-[#242B3A] cursor-pointer";
                        }
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked || isHeld}
                          title={`Row ${seat.row} Seat ${seat.number} (${seat.category}) - ${formatINR(
                            seat.price
                          )}`}
                          className={seatClasses}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : isBooked ? (
                            "✕"
                          ) : (
                            seat.number
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <span className="w-5 text-xs font-bold text-[#8E9AA8] text-left">
                    {row}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Cart Bar */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-[#1A1F2C]/95 backdrop-blur-md border-t border-[#2D3748] p-4 mt-10 rounded-t-2xl shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8E9AA8]">Selected Seats:</span>
              <span className="text-sm font-bold text-white">
                {selectedSeatsList.length > 0
                  ? selectedSeatsList
                      .map((s) => `${s.row}${s.number}`)
                      .join(", ")
                  : "None"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#8E9AA8]">Total Amount:</span>
              <span className="text-lg font-black text-[#E8B86D]">
                {formatINR(subtotal)}
              </span>
              <span className="text-[10px] text-[#8E9AA8]">(excl. GST)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {holdTimer !== null && holdTimer > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(holdTimer)}</span>
              </div>
            )}

            <button
              onClick={handleLockSeats}
              disabled={selectedSeatIds.length === 0 || isLocking}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-[#E83B50]/30 transition-all"
            >
              {isLocking ? "Locking Seats..." : "Lock Seats & Proceed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

