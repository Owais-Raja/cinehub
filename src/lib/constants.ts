// CineHub Business Constants & Rules (India Market)

export const GST_RATE = Number(process.env.GST_RATE_PERCENT || 18) / 100; // 18% GST (9% CGST + 9% SGST)
export const CONVENIENCE_FEE = Number(process.env.CONVENIENCE_FEE_INR || 30); // ₹30 per booking
export const SEAT_HOLD_DURATION_MINUTES = Number(process.env.SEAT_HOLD_DURATION_MINUTES || 10); // 10 minutes TTL
export const CANCELLATION_DEADLINE_HOURS = Number(process.env.CANCELLATION_DEADLINE_HOURS || 2); // 2 hours prior to showtime
export const MAX_SEATS_PER_BOOKING = 10;

export const SEAT_TIER_COLORS = {
  SILVER: {
    name: "Silver",
    color: "#8E9AA8",
    bg: "bg-slate-700",
    border: "border-slate-500",
  },
  GOLD: {
    name: "Gold",
    color: "#E2E8F0",
    bg: "bg-amber-600/30",
    border: "border-amber-400",
  },
  PLATINUM: {
    name: "Platinum",
    color: "#CBD5E1",
    bg: "bg-blue-600/30",
    border: "border-blue-400",
  },
  RECLINER: {
    name: "Recliner (VIP)",
    color: "#E8B86D",
    bg: "bg-amber-500/40",
    border: "border-[#E8B86D]",
  },
} as const;

export const INDIAN_CITIES = [
  { name: "Mumbai", state: "Maharashtra", slug: "mumbai" },
  { name: "Delhi-NCR", state: "Delhi", slug: "delhi-ncr" },
  { name: "Bengaluru", state: "Karnataka", slug: "bengaluru" },
  { name: "Hyderabad", state: "Telangana", slug: "hyderabad" },
  { name: "Chennai", state: "Tamil Nadu", slug: "chennai" },
  { name: "Kolkata", state: "West Bengal", slug: "kolkata" },
  { name: "Pune", state: "Maharashtra", slug: "pune" },
  { name: "Chandigarh", state: "Punjab", slug: "chandigarh" },
];
