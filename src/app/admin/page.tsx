import { ReportService } from "@/services/report.service";
import { formatINR } from "@/lib/utils";
import { DollarSign, Ticket, Users, TrendingUp, Film } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardOverview() {
  const [salesReport, occupancyReport] = await Promise.all([
    ReportService.getSalesReport(),
    ReportService.getOccupancyReport(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        <p className="text-xs text-[#8E9AA8] mt-0.5">
          Real-time metrics calculated from database transactions
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#212836] p-5 rounded-2xl border border-[#2D3748] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8E9AA8] font-medium">Net Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#E83B50]/15 text-[#E83B50] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-white">{formatINR(salesReport.netRevenue)}</span>
          <p className="text-[10px] text-[#8E9AA8] mt-1">
            Gross: {formatINR(salesReport.grossRevenue)}
          </p>
        </div>

        <div className="bg-[#212836] p-5 rounded-2xl border border-[#2D3748] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8E9AA8] font-medium">Occupancy Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8B86D]/15 text-[#E8B86D] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-[#E8B86D]">
            {occupancyReport.overallOccupancyPercentage}%
          </span>
          <p className="text-[10px] text-[#8E9AA8] mt-1">
            {occupancyReport.totalBookedSeats} / {occupancyReport.totalCapacity} seats
          </p>
        </div>

        <div className="bg-[#212836] p-5 rounded-2xl border border-[#2D3748] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8E9AA8] font-medium">Confirmed Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-white">
            {salesReport.confirmedBookingsCount}
          </span>
          <p className="text-[10px] text-[#8E9AA8] mt-1">
            Active customer orders
          </p>
        </div>

        <div className="bg-[#212836] p-5 rounded-2xl border border-[#2D3748] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8E9AA8] font-medium">Refunds Simulated</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-white">
            {formatINR(salesReport.totalRefunds)}
          </span>
          <p className="text-[10px] text-[#8E9AA8] mt-1">
            {salesReport.refundsCount} cancellations processed
          </p>
        </div>
      </div>

      {/* Top Movies Performance */}
      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-[#E83B50]" />
          <span>Top Performing Movies</span>
        </h3>

        {salesReport.topMovies.length > 0 ? (
          <div className="space-y-3">
            {salesReport.topMovies.map((movie, idx) => (
              <div
                key={movie.title}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1E2430] border border-[#2D3748] text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#E8B86D] w-4">{idx + 1}.</span>
                  <div>
                    <h4 className="font-bold text-white">{movie.title}</h4>
                    <span className="text-[10px] text-[#8E9AA8]">{movie.tickets} orders</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-white">{formatINR(movie.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8E9AA8] text-center py-6">
            No sales records yet. Book tickets through the customer portal to populate metrics.
          </p>
        )}
      </div>
    </div>
  );
}

