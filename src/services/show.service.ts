import prisma from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/rbac";
import { AuditService } from "./audit.service";
import { SeatCategory, ShowStatus } from "@prisma/client";

export class ShowService {
  /**
   * Schedules a show with automated collision detection
   */
  static async createShow({
    movieId,
    screenId,
    languageId,
    formatId,
    startTime,
    basePrice,
    categoryPrices = [],
    adminUserId,
  }: {
    movieId: string;
    screenId: string;
    languageId: string;
    formatId: string;
    startTime: Date;
    basePrice: number;
    categoryPrices?: { category: SeatCategory; price: number }[];
    adminUserId?: string;
  }) {
    // 1. Fetch movie runtime
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { durationMins: true, title: true },
    });

    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    // Add 20 minutes buffer for cleaning & trailers
    const runtimeMs = (movie.durationMins + 20) * 60 * 1000;
    const endTime = new Date(startTime.getTime() + runtimeMs);

    // 2. Collision Detection: Ensure screen is not occupied
    const conflictingShow = await prisma.show.findFirst({
      where: {
        screenId,
        status: { not: ShowStatus.CANCELLED },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
      include: { movie: true },
    });

    if (conflictingShow) {
      throw new ConflictError(
        `Schedule Conflict: This screen is already occupied by "${conflictingShow.movie.title}" from ${conflictingShow.startTime.toLocaleTimeString()} to ${conflictingShow.endTime.toLocaleTimeString()}.`
      );
    }

    // 3. Create Show with category price overrides in transaction
    return await prisma.$transaction(async (tx) => {
      const show = await tx.show.create({
        data: {
          movieId,
          screenId,
          languageId,
          formatId,
          startTime,
          endTime,
          basePrice,
          status: ShowStatus.SCHEDULED,
        },
      });

      if (categoryPrices.length > 0) {
        await tx.showSeatPrice.createMany({
          data: categoryPrices.map((cp) => ({
            showId: show.id,
            category: cp.category,
            price: cp.price,
          })),
        });
      }

      await AuditService.log({
        userId: adminUserId,
        action: "SHOW_SCHEDULED",
        entityType: "Show",
        entityId: show.id,
        metadata: {
          movieTitle: movie.title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      return show;
    });
  }

  /**
   * Retrieves shows grouped by theatre for customer showtime selection
   */
  static async getShowsForMovieAndCity({
    movieId,
    cityId,
    citySlug,
    date,
  }: {
    movieId: string;
    cityId?: string;
    citySlug?: string;
    date: Date;
  }) {
    // Start and end of selected day (local timezone)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shows = await prisma.show.findMany({
      where: {
        movieId,
        status: ShowStatus.SCHEDULED,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        screen: {
          theatre: {
            isActive: true,
            ...(cityId ? { cityId } : {}),
            ...(citySlug ? { city: { slug: citySlug } } : {}),
          },
        },
      },
      include: {
        screen: {
          include: {
            theatre: {
              include: { city: true },
            },
          },
        },
        language: true,
        format: true,
        prices: true,
      },
      orderBy: { startTime: "asc" },
    });

    // Group shows by Theatre
    const theatreMap = new Map<
      string,
      {
        theatreId: string;
        theatreName: string;
        address: string;
        shows: Array<{
          id: string;
          screenName: string;
          screenType: string;
          startTime: string;
          language: string;
          format: string;
          basePrice: number;
        }>;
      }
    >();

    for (const show of shows) {
      const th = show.screen.theatre;
      if (!theatreMap.has(th.id)) {
        theatreMap.set(th.id, {
          theatreId: th.id,
          theatreName: th.name,
          address: th.address,
          shows: [],
        });
      }

      theatreMap.get(th.id)!.shows.push({
        id: show.id,
        screenName: show.screen.name,
        screenType: show.screen.screenType,
        startTime: show.startTime.toISOString(),
        language: show.language.name,
        format: show.format.name,
        basePrice: Number(show.basePrice),
      });
    }

    return Array.from(theatreMap.values());
  }
}
