import prisma from "@/lib/prisma";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export class ReportService {
  /**
   * Generates real-time occupancy report dynamically reflecting bookings and cancellations.
   * Directly satisfies Mandatory Acceptance Test AT-5.
   */
  static async getOccupancyReport({
    theatreId,
    movieId,
    startDate,
    endDate,
  }: {
    theatreId?: string;
    movieId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    // 1. Fetch relevant shows with screens and bookings
    const shows = await prisma.show.findMany({
      where: {
        ...(theatreId ? { screen: { theatreId } } : {}),
        ...(movieId ? { movieId } : {}),
        ...(startDate || endDate
          ? {
              startTime: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        movie: { select: { title: true } },
        screen: {
          include: {
            theatre: { select: { name: true, city: { select: { name: true } } } },
          },
        },
        bookingSeats: {
          where: {
            booking: { status: BookingStatus.CONFIRMED },
          },
        },
        bookings: {
          select: { status: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    let totalCapacity = 0;
    let totalBookedSeats = 0;
    let totalCancelledBookings = 0;

    const showReports = shows.map((show) => {
      const capacity = show.screen.totalSeats;
      const bookedCount = show.bookingSeats.length;
      const cancelledCount = show.bookings.filter(
        (b) => b.status === BookingStatus.CANCELLED
      ).length;

      totalCapacity += capacity;
      totalBookedSeats += bookedCount;
      totalCancelledBookings += cancelledCount;

      const occupancyRate = capacity > 0 ? (bookedCount / capacity) * 100 : 0;

      return {
        showId: show.id,
        movieTitle: show.movie.title,
        theatreName: show.screen.theatre.name,
        cityName: show.screen.theatre.city.name,
        screenName: show.screen.name,
        startTime: show.startTime.toISOString(),
        totalCapacity: capacity,
        bookedSeats: bookedCount,
        availableSeats: Math.max(0, capacity - bookedCount),
        occupancyPercentage: Math.round(occupancyRate * 10) / 10,
      };
    });

    const overallOccupancyRate =
      totalCapacity > 0 ? (totalBookedSeats / totalCapacity) * 100 : 0;

    return {
      totalShows: shows.length,
      totalCapacity,
      totalBookedSeats,
      totalCancelledBookings,
      overallOccupancyPercentage: Math.round(overallOccupancyRate * 10) / 10,
      shows: showReports,
    };
  }

  /**
   * Generates financial and sales report
   */
  static async getSalesReport({
    startDate,
    endDate,
  }: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        payment: true,
        show: {
          include: {
            movie: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const refunds = await prisma.refund.findMany({
      where: {
        status: "COMPLETED",
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
    });

    let grossRevenue = 0;
    let totalTaxCollected = 0;
    let totalConvenienceFees = 0;

    const paymentMethodBreakdown: Record<string, number> = {
      UPI: 0,
      CARD: 0,
      NETBANKING: 0,
    };

    const movieSalesMap: Record<string, { title: string; revenue: number; tickets: number }> =
      {};

    for (const b of confirmedBookings) {
      const amount = Number(b.totalAmount);
      grossRevenue += amount;
      totalTaxCollected += Number(b.taxAmount);
      totalConvenienceFees += Number(b.convenienceFee);

      if (b.payment?.method) {
        paymentMethodBreakdown[b.payment.method] =
          (paymentMethodBreakdown[b.payment.method] || 0) + amount;
      }

      const movieTitle = b.show.movie.title;
      if (!movieSalesMap[movieTitle]) {
        movieSalesMap[movieTitle] = { title: movieTitle, revenue: 0, tickets: 0 };
      }
      movieSalesMap[movieTitle].revenue += amount;
      movieSalesMap[movieTitle].tickets += 1;
    }

    let totalRefunds = 0;
    for (const r of refunds) {
      totalRefunds += Number(r.amount);
    }

    const netRevenue = grossRevenue - totalRefunds;

    return {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      totalConvenienceFees: Math.round(totalConvenienceFees * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      confirmedBookingsCount: confirmedBookings.length,
      refundsCount: refunds.length,
      paymentMethodBreakdown,
      topMovies: Object.values(movieSalesMap).sort((a, b) => b.revenue - a.revenue),
    };
  }
}
