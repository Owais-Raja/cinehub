import prisma from "../src/lib/prisma";

async function main() {
  console.log("🧹 Clearing all movie-related records from database...");

  await prisma.ticketValidation.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingSeat.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.seatHold.deleteMany({});
  await prisma.showSeatPrice.deleteMany({});
  await prisma.show.deleteMany({});
  await prisma.movieGenre.deleteMany({});
  const { count } = await prisma.movie.deleteMany({});

  console.log(`✅ All movies cleared successfully! (${count} movies removed)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

