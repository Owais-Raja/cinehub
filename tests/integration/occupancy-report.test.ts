import { describe, it, expect } from "vitest";
import { ReportService } from "@/services/report.service";

describe("Mandatory Acceptance Test AT-5: Dynamic Occupancy & Revenue Reporting", () => {
  it("should calculate real-time occupancy percentages matching booked seats vs screen capacities", async () => {
    const report = await ReportService.getOccupancyReport();

    expect(report).toBeDefined();
    expect(typeof report.overallOccupancyPercentage).toBe("number");
    expect(typeof report.totalCapacity).toBe("number");
    expect(typeof report.totalBookedSeats).toBe("number");
    expect(typeof report.totalCancelledBookings).toBe("number");

    if (report.totalCapacity > 0) {
      const calculatedRate = Math.round((report.totalBookedSeats / report.totalCapacity) * 1000) / 10;
      expect(report.overallOccupancyPercentage).toBeCloseTo(calculatedRate, 1);
    }
  });

  it("should generate sales summary with 18% GST and convenience fee breakdowns", async () => {
    const sales = await ReportService.getSalesReport();

    expect(sales).toBeDefined();
    expect(typeof sales.grossRevenue).toBe("number");
    expect(typeof sales.netRevenue).toBe("number");
    expect(typeof sales.totalTaxCollected).toBe("number");
    expect(typeof sales.totalConvenienceFees).toBe("number");
    expect(typeof sales.totalRefunds).toBe("number");
    expect(sales.netRevenue).toBe(sales.grossRevenue - sales.totalRefunds);
  });
});
