import prisma from "@/lib/prisma";
import { SeatCategory } from "@prisma/client";
import { AuditService } from "./audit.service";

export class TheatreService {
  static async getCities() {
    return prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  static async getTheatres(cityId?: string) {
    return prisma.theatre.findMany({
      where: {
        isActive: true,
        ...(cityId ? { cityId } : {}),
      },
      include: {
        city: true,
        screens: {
          where: { isActive: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async createTheatre({
    name,
    cityId,
    address,
    adminUserId,
  }: {
    name: string;
    cityId: string;
    address: string;
    adminUserId?: string;
  }) {
    const theatre = await prisma.theatre.create({
      data: { name, cityId, address },
    });

    await AuditService.log({
      userId: adminUserId,
      action: "THEATRE_CREATED",
      entityType: "Theatre",
      entityId: theatre.id,
      metadata: { name, address },
    });

    return theatre;
  }

  /**
   * Creates a screen and automatically generates physical seats with row categories
   */
  static async createScreenWithSeatLayout({
    theatreId,
    name,
    screenType = "STANDARD",
    rows = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"],
    seatsPerRow = 15,
    adminUserId,
  }: {
    theatreId: string;
    name: string;
    screenType?: string;
    rows?: string[];
    seatsPerRow?: number;
    adminUserId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const totalSeats = rows.length * seatsPerRow;
      const screen = await tx.screen.create({
        data: {
          theatreId,
          name,
          screenType,
          totalSeats,
        },
      });

      // Generate seats
      const seatRecords = [];
      for (const row of rows) {
        let category: SeatCategory = SeatCategory.SILVER;
        if (["D", "E", "F", "G", "H"].includes(row)) category = SeatCategory.GOLD;
        if (["J", "K", "L"].includes(row)) category = SeatCategory.PLATINUM;
        if (row === "M") category = SeatCategory.RECLINER;

        for (let num = 1; num <= seatsPerRow; num++) {
          seatRecords.push({
            screenId: screen.id,
            row,
            number: num,
            category,
          });
        }
      }

      await tx.seat.createMany({
        data: seatRecords,
      });

      await AuditService.log({
        userId: adminUserId,
        action: "SCREEN_CREATED",
        entityType: "Screen",
        entityId: screen.id,
        metadata: { name, totalSeats },
      });

      return screen;
    });
  }
}
