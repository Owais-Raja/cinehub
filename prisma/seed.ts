import { PrismaClient, Role, SeatCategory, MovieStatus, Certification, ShowStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CineHub database seeding with Indian Cinema dataset...");

  // 1. Clean existing records in correct foreign key order
  await prisma.auditLog.deleteMany({});
  await prisma.ticketValidation.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bookingSeat.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.seatHold.deleteMany({});
  await prisma.showSeatPrice.deleteMany({});
  await prisma.show.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.screen.deleteMany({});
  await prisma.theatre.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.movieGenre.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.language.deleteMany({});
  await prisma.format.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Existing database tables cleaned.");

  // 2. Seed Users
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const staffPassword = await bcrypt.hash("Staff@1234", 12);
  const customerPassword = await bcrypt.hash("Customer@1234", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@cinehub.in",
      passwordHash: adminPassword,
      fullName: "Anand Verma (Administrator)",
      phone: "+919811122233",
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@cinehub.in",
      passwordHash: staffPassword,
      fullName: "Ramesh Sharma (Gate Staff)",
      phone: "+919822233344",
      role: Role.STAFF,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: "rajesh@example.com",
      passwordHash: customerPassword,
      fullName: "Rajesh Kumar",
      phone: "+919833344455",
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "priya@example.com",
      passwordHash: customerPassword,
      fullName: "Priya Sharma",
      phone: "+919844455566",
      role: Role.CUSTOMER,
    },
  });

  console.log("👤 Demo accounts created for Admin, Staff, and Customers.");

  // 3. Seed Indian Cities
  const citiesData = [
    { name: "Mumbai", state: "Maharashtra", slug: "mumbai" },
    { name: "Delhi-NCR", state: "Delhi", slug: "delhi-ncr" },
    { name: "Bengaluru", state: "Karnataka", slug: "bengaluru" },
    { name: "Hyderabad", state: "Telangana", slug: "hyderabad" },
    { name: "Chennai", state: "Tamil Nadu", slug: "chennai" },
    { name: "Kolkata", state: "West Bengal", slug: "kolkata" },
    { name: "Pune", state: "Maharashtra", slug: "pune" },
    { name: "Chandigarh", state: "Punjab", slug: "chandigarh" },
  ];

  const cityMap = new Map<string, string>();
  for (const c of citiesData) {
    const city = await prisma.city.create({ data: c });
    cityMap.set(c.slug, city.id);
  }

  // 4. Seed Genres
  const genresData = [
    { name: "Action", slug: "action" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Drama", slug: "drama" },
    { name: "Thriller", slug: "thriller" },
    { name: "Comedy", slug: "comedy" },
    { name: "Romance", slug: "romance" },
    { name: "Horror", slug: "horror" },
  ];
  const genreMap = new Map<string, string>();
  for (const g of genresData) {
    const genre = await prisma.genre.create({ data: g });
    genreMap.set(g.slug, genre.id);
  }

  // 5. Seed Languages & Formats
  const languagesData = [
    { name: "Hindi", code: "hi" },
    { name: "English", code: "en" },
    { name: "Telugu", code: "te" },
    { name: "Tamil", code: "ta" },
    { name: "Malayalam", code: "ml" },
    { name: "Punjabi", code: "pa" },
  ];
  const langMap = new Map<string, string>();
  for (const l of languagesData) {
    const lang = await prisma.language.create({ data: l });
    langMap.set(l.code, lang.id);
  }

  const formatsData = [
    { name: "2D", slug: "2d" },
    { name: "3D", slug: "3d" },
    { name: "IMAX 2D", slug: "imax-2d" },
    { name: "IMAX 3D", slug: "imax-3d" },
    { name: "4DX", slug: "4dx" },
  ];
  const formatMap = new Map<string, string>();
  for (const f of formatsData) {
    const fmt = await prisma.format.create({ data: f });
    formatMap.set(f.slug, fmt.id);
  }

  // 6. Seed In-Theaters & Upcoming Blockbusters (Live Cinema Dataset)
  const moviesData = [
    {
      title: "Pushpa 2: The Rule",
      slug: "pushpa-2-the-rule",
      synopsis:
        "Pushpa Raj continues to rule the red sandalwood syndicate with an iron fist, facing fierce retaliation from SP Bhanwar Singh Shekhawat in an explosive showdown of power, dominance, and survival.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=1kVK0MZlbI4",
      durationMins: 200,
      certification: Certification.A,
      releaseDate: new Date(),
      status: MovieStatus.NOW_SHOWING,
      genres: ["action", "thriller"],
    },
    {
      title: "Singham Again",
      slug: "singham-again",
      synopsis:
        "DCP Bajirao Singham unites with India's most fierce cop universe heroes on a high-stakes cross-border mission to rescue his abducted wife from an international terror syndicate.",
      posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=sU3fKqK3wXk",
      durationMins: 164,
      certification: Certification.UA,
      releaseDate: new Date(),
      status: MovieStatus.NOW_SHOWING,
      genres: ["action", "drama"],
    },
    {
      title: "Bhool Bhulaiyaa 3",
      slug: "bhool-bhulaiyaa-3",
      synopsis:
        "Rooh Baba visits the royal palace of Bengal for a mock exorcism, only to face two terrifying iterations of Manjulika seeking vengeance for historic bloodshed.",
      posterUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=UqQY9_q7R8U",
      durationMins: 158,
      certification: Certification.UA,
      releaseDate: new Date(),
      status: MovieStatus.NOW_SHOWING,
      genres: ["comedy", "horror"],
    },
    {
      title: "Kalki 2898 AD",
      slug: "kalki-2898-ad",
      synopsis:
        "A modern avatar of Vishnu descends to Earth to protect the world from evil forces in a dystopian futuristic city of Kasi.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=kQDd1AhGIHk",
      durationMins: 181,
      certification: Certification.UA,
      releaseDate: new Date(),
      status: MovieStatus.NOW_SHOWING,
      genres: ["action", "sci-fi"],
    },
    {
      title: "Stree 2",
      slug: "stree-2",
      synopsis:
        "The town of Chanderi is being haunted again, this time by a headless entity named Sarkata that is abducting modern women.",
      posterUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=KVnhefc6VqE",
      durationMins: 149,
      certification: Certification.UA,
      releaseDate: new Date(),
      status: MovieStatus.NOW_SHOWING,
      genres: ["comedy", "horror"],
    },
    {
      title: "Avengers: Doomsday",
      slug: "avengers-doomsday",
      synopsis:
        "Earth's Mightiest Heroes face the terrifying multiverse threat of Doctor Victor Von Doom in an unprecedented multiversal cataclysm.",
      posterUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=e_wK7hJ5A8A",
      durationMins: 175,
      certification: Certification.UA,
      releaseDate: new Date("2026-05-01"),
      status: MovieStatus.COMING_SOON,
      genres: ["action", "sci-fi"],
    },
    {
      title: "Dune 3 (Dune: Messiah)",
      slug: "dune-3",
      synopsis:
        "Paul Atreides faces the devastating consequences of his galactic holy war as the emperor of the known universe, confronting political conspiracy and deep religious schisms.",
      posterUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      durationMins: 170,
      certification: Certification.UA,
      releaseDate: new Date("2026-12-18"),
      status: MovieStatus.COMING_SOON,
      genres: ["sci-fi", "drama"],
    },
    {
      title: "King",
      slug: "king",
      synopsis:
        "A veteran underworld assassin embarks on an international crusade to shield his protege from high-level syndicate retribution across Europe.",
      posterUrl: "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=MWOlnZSnXWE",
      durationMins: 160,
      certification: Certification.A,
      releaseDate: new Date("2026-10-02"),
      status: MovieStatus.COMING_SOON,
      genres: ["action", "thriller"],
    },
    {
      title: "Matrubhoomi",
      slug: "matrubhoomi",
      synopsis:
        "A gripping historical battle saga celebrating untold freedom fighters protecting India's sovereign frontier against imperial conquest.",
      posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1600&q=80",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      durationMins: 155,
      certification: Certification.UA,
      releaseDate: new Date("2026-08-15"),
      status: MovieStatus.COMING_SOON,
      genres: ["drama", "action"],
    },
  ];

  const movieMap = new Map<string, string>();
  for (const m of moviesData) {
    const movie = await prisma.movie.create({
      data: {
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        posterUrl: m.posterUrl,
        bannerUrl: m.bannerUrl,
        trailerUrl: m.trailerUrl,
        durationMins: m.durationMins,
        certification: m.certification,
        releaseDate: m.releaseDate,
        status: m.status,
        genres: {
          create: m.genres.map((g) => ({
            genre: { connect: { id: genreMap.get(g)! } },
          })),
        },
      },
    });
    movieMap.set(m.slug, movie.id);
  }

  // 7. Seed Theatres, Screens & Complete Seat Layouts
  const theatresData = [
    {
      name: "PVR INOX Palladium",
      citySlug: "mumbai",
      address: "High Street Phoenix, Lower Parel, Mumbai, Maharashtra 400013",
      screens: [
        { name: "Audi 1", screenType: "STANDARD", seatsPerRow: 14 },
        { name: "IMAX Hall", screenType: "IMAX", seatsPerRow: 16 },
      ],
    },
    {
      name: "PVR Directors Cut",
      citySlug: "delhi-ncr",
      address: "Select Citywalk, Saket District Centre, New Delhi 110017",
      screens: [
        { name: "Gold Class 1", screenType: "GOLD_CLASS", seatsPerRow: 12 },
        { name: "Audi 2", screenType: "STANDARD", seatsPerRow: 14 },
      ],
    },
    {
      name: "Cinepolis Forum Mall",
      citySlug: "bengaluru",
      address: "Hosur Road, Koramangala, Bengaluru, Karnataka 560095",
      screens: [
        { name: "Audi 1", screenType: "STANDARD", seatsPerRow: 14 },
      ],
    },
  ];

  const screenMap = new Map<string, string>();

  for (const th of theatresData) {
    const theatre = await prisma.theatre.create({
      data: {
        name: th.name,
        cityId: cityMap.get(th.citySlug)!,
        address: th.address,
      },
    });

    for (const sc of th.screens) {
      const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"];
      const totalSeats = rows.length * sc.seatsPerRow;

      const screen = await prisma.screen.create({
        data: {
          theatreId: theatre.id,
          name: sc.name,
          screenType: sc.screenType,
          totalSeats,
        },
      });

      screenMap.set(`${th.name}-${sc.name}`, screen.id);

      // Generate Seats
      const seatBatch = [];
      for (const row of rows) {
        let category: SeatCategory = SeatCategory.SILVER;
        if (["D", "E", "F", "G", "H"].includes(row)) category = SeatCategory.GOLD;
        if (["J", "K", "L"].includes(row)) category = SeatCategory.PLATINUM;
        if (row === "M") category = SeatCategory.RECLINER;

        for (let num = 1; num <= sc.seatsPerRow; num++) {
          seatBatch.push({
            screenId: screen.id,
            row,
            number: num,
            category,
          });
        }
      }

      await prisma.seat.createMany({ data: seatBatch });
    }
  }

  console.log("🎬 Theatres, screens, and categorized seat maps created.");

  // 8. Seed Upcoming Shows
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const showsToSeed = [
    {
      movieSlug: "pushpa-2-the-rule",
      screenKey: "PVR INOX Palladium-IMAX Hall",
      langCode: "hi",
      formatSlug: "imax-2d",
      startTime: new Date(today.getTime() + 14.5 * 3600 * 1000), // Today 2:30 PM
      durationMins: 200,
      basePrice: 400.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 400.0 },
        { category: SeatCategory.GOLD, price: 500.0 },
        { category: SeatCategory.PLATINUM, price: 650.0 },
        { category: SeatCategory.RECLINER, price: 950.0 },
      ],
    },
    {
      movieSlug: "pushpa-2-the-rule",
      screenKey: "PVR INOX Palladium-IMAX Hall",
      langCode: "hi",
      formatSlug: "imax-2d",
      startTime: new Date(today.getTime() + 19 * 3600 * 1000), // Today 7:00 PM
      durationMins: 200,
      basePrice: 450.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 450.0 },
        { category: SeatCategory.GOLD, price: 550.0 },
        { category: SeatCategory.PLATINUM, price: 700.0 },
        { category: SeatCategory.RECLINER, price: 1000.0 },
      ],
    },
    {
      movieSlug: "singham-again",
      screenKey: "PVR INOX Palladium-Audi 1",
      langCode: "hi",
      formatSlug: "2d",
      startTime: new Date(today.getTime() + 15 * 3600 * 1000), // Today 3:00 PM
      durationMins: 164,
      basePrice: 300.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 300.0 },
        { category: SeatCategory.GOLD, price: 400.0 },
        { category: SeatCategory.PLATINUM, price: 520.0 },
        { category: SeatCategory.RECLINER, price: 750.0 },
      ],
    },
    {
      movieSlug: "bhool-bhulaiyaa-3",
      screenKey: "PVR Directors Cut-Gold Class 1",
      langCode: "hi",
      formatSlug: "2d",
      startTime: new Date(today.getTime() + 17 * 3600 * 1000), // Today 5:00 PM
      durationMins: 158,
      basePrice: 450.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 450.0 },
        { category: SeatCategory.GOLD, price: 550.0 },
        { category: SeatCategory.PLATINUM, price: 680.0 },
        { category: SeatCategory.RECLINER, price: 950.0 },
      ],
    },
    {
      movieSlug: "kalki-2898-ad",
      screenKey: "PVR Directors Cut-Audi 2",
      langCode: "hi",
      formatSlug: "2d",
      startTime: new Date(today.getTime() + 16 * 3600 * 1000), // Today 4:00 PM
      durationMins: 181,
      basePrice: 320.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 320.0 },
        { category: SeatCategory.GOLD, price: 420.0 },
        { category: SeatCategory.PLATINUM, price: 550.0 },
        { category: SeatCategory.RECLINER, price: 800.0 },
      ],
    },
    {
      movieSlug: "stree-2",
      screenKey: "Cinepolis Forum Mall-Audi 1",
      langCode: "hi",
      formatSlug: "2d",
      startTime: new Date(today.getTime() + 18 * 3600 * 1000), // Today 6:00 PM
      durationMins: 149,
      basePrice: 280.0,
      tierPrices: [
        { category: SeatCategory.SILVER, price: 280.0 },
        { category: SeatCategory.GOLD, price: 380.0 },
        { category: SeatCategory.PLATINUM, price: 480.0 },
        { category: SeatCategory.RECLINER, price: 700.0 },
      ],
    },
  ];

  for (const s of showsToSeed) {
    const endTime = new Date(s.startTime.getTime() + (s.durationMins + 20) * 60000);
    const screenId = screenMap.get(s.screenKey)!;

    const show = await prisma.show.create({
      data: {
        movieId: movieMap.get(s.movieSlug)!,
        screenId,
        languageId: langMap.get(s.langCode)!,
        formatId: formatMap.get(s.formatSlug)!,
        startTime: s.startTime,
        endTime,
        basePrice: s.basePrice,
        status: ShowStatus.SCHEDULED,
      },
    });

    for (const tp of s.tierPrices) {
      await prisma.showSeatPrice.create({
        data: {
          showId: show.id,
          category: tp.category,
          price: tp.price,
        },
      });
    }
  }

  console.log("🎟️ Shows and category pricing overrides seeded.");
  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
