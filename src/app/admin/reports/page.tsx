import { ReportService } from "@/services/report.service";
import { formatINR, formatTime } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Ticket, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [occupancyReport, salesReport] = await Promise.all([
    ReportService.getOccupancyReport(),
    ReportService.getSalesReport(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8B86D]/20 text-[#E8B86D] border border-[#E8B86D]/30 text-[10px] font-mono font-bold">
            MANDATORY ACCEPTANCE TEST AT-5
          </span>
        </div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#E83B50]" />
          <span>Occupancy & Financial Reports</span>
        </h1>
        <p className="text-xs text-[#8E9AA8] mt-0.5">
          Dynamic calculations derived directly from active BookingSeat records minus cancellations
        </p>
      </div>

      {/* Real-Time Occupancy Summary Card */}
      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#E8B86D]" />
          <span>Live Screen Occupancy Overview</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[11px] text-[#8E9AA8]">Overall Occupancy</span>
            <p className="text-xl font-black text-[#E8B86D] mt-1">
              {occupancyReport.overallOccupancyPercentage}%
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[11px] text-[#8E9AA8]">Total Seat Capacity</span>
            <p className="text-xl font-black text-white mt-1">
              {occupancyReport.totalCapacity}
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[11px] text-[#8E9AA8]">Confirmed Booked Seats</span>
            <p className="text-xl font-black text-emerald-400 mt-1">
              {occupancyReport.totalBookedSeats}
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[11px] text-[#8E9AA8]">Cancelled Bookings</span>
            <p className="text-xl font-black text-red-400 mt-1">
              {occupancyReport.totalCancelledBookings}
            </p>
          </div>
        </div>

        {/* Show-by-Show Occupancy Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2D3748] text-[#8E9AA8]">
                <th className="py-2.5 pr-4 font-semibold">Movie Title</th>
                <th className="py-2.5 px-4 font-semibold">Cinema & Screen</th>
                <th className="py-2.5 px-4 font-semibold">Showtime</th>
                <th className="py-2.5 px-4 font-semibold">Capacity</th>
                <th className="py-2.5 px-4 font-semibold">Booked</th>
                <th className="py-2.5 pl-4 font-semibold">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]/50">
              {occupancyReport.shows.map((show) => (
                <tr key={show.showId} className="hover:bg-[#1E2430]/60 transition-colors">
                  <td className="py-3 pr-4 font-bold text-white">{show.movieTitle}</td>
                  <td className="py-3 px-4 text-[#8E9AA8]">
                    {show.theatreName} <span className="text-[#F4F3F0]">({show.screenName})</span>
                  </td>
                  <td className="py-3 px-4 text-[#8E9AA8]">{formatTime(show.startTime)}</td>
                  <td className="py-3 px-4 text-white font-mono">{show.totalCapacity}</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono font-bold">{show.bookedSeats}</td>
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#1E2430] h-2 rounded-full overflow-hidden border border-[#2D3748]">
                        <div
                          className="bg-[#E83B50] h-full rounded-full"
                          style={{ width: `${Math.min(100, show.occupancyPercentage)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-white">
                        {show.occupancyPercentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Sales Breakdown */}
      <div className="bg-[#212836] rounded-2xl border border-[#2D3748] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#E83B50]" />
          <span>Financial Sales & Tax Summary</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[#8E9AA8]">Gross Sales</span>
            <p className="text-base font-bold text-white mt-1">
              {formatINR(salesReport.grossRevenue)}
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[#8E9AA8]">GST Collected (18%)</span>
            <p className="text-base font-bold text-[#E8B86D] mt-1">
              {formatINR(salesReport.totalTaxCollected)}
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[#8E9AA8]">Platform Fees</span>
            <p className="text-base font-bold text-white mt-1">
              {formatINR(salesReport.totalConvenienceFees)}
            </p>
          </div>
          <div className="p-3 bg-[#1E2430] rounded-xl border border-[#2D3748]">
            <span className="text-[#8E9AA8]">Net Operating Revenue</span>
            <p className="text-base font-black text-emerald-400 mt-1">
              {formatINR(salesReport.netRevenue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

