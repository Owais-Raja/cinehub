import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/rbac";
import { AuditService } from "./audit.service";
import { MovieStatus, Certification } from "@prisma/client";
import { slugify } from "@/lib/utils";

export class MovieService {
  static async getMovies({
    citySlug,
    genreSlug,
    languageCode,
    status,
    search,
    page = 1,
    limit = 12,
  }: {
    citySlug?: string;
    genreSlug?: string;
    languageCode?: string;
    status?: MovieStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (genreSlug) {
      where.genres = {
        some: {
          genre: { slug: genreSlug },
        },
      };
    }

    if (languageCode || citySlug) {
      where.shows = {
        some: {
          ...(languageCode ? { language: { code: languageCode } } : {}),
          ...(citySlug ? { screen: { theatre: { city: { slug: citySlug } } } } : {}),
          startTime: { gte: new Date() },
        },
      };
    }

    const [totalCount, movies] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        include: {
          genres: { include: { genre: true } },
          shows: {
            where: { startTime: { gte: new Date() } },
            select: { id: true, format: true, language: true },
            take: 5,
          },
        },
        orderBy: [{ releaseDate: "desc" }, { title: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      movies: movies.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        posterUrl: m.posterUrl,
        bannerUrl: m.bannerUrl,
        durationMins: m.durationMins,
        certification: m.certification,
        releaseDate: m.releaseDate.toISOString(),
        status: m.status,
        genres: m.genres.map((g) => g.genre.name),
        availableFormats: Array.from(new Set(m.shows.map((s) => s.format.name))),
        availableLanguages: Array.from(new Set(m.shows.map((s) => s.language.name))),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  static async getMovieBySlug(slug: string) {
    const movie = await prisma.movie.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
      },
    });

    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    return movie;
  }

  static async createMovie({
    title,
    slug,
    synopsis,
    posterUrl,
    bannerUrl,
    trailerUrl,
    durationMins,
    certification = "UA",
    releaseDate,
    status = "NOW_SHOWING",
    genreIds = [],
    adminUserId,
  }: {
    title: string;
    slug?: string;
    synopsis: string;
    posterUrl: string;
    bannerUrl?: string;
    trailerUrl?: string;
    durationMins: number;
    certification?: Certification;
    releaseDate: Date;
    status?: MovieStatus;
    genreIds?: string[];
    adminUserId?: string;
  }) {
    const baseSlug = slug || slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.movie.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        slug: finalSlug,
        synopsis,
        posterUrl,
        bannerUrl: bannerUrl || posterUrl,
        trailerUrl,
        durationMins,
        certification,
        releaseDate,
        status,
        genres: {
          create: genreIds.map((genreId) => ({
            genre: { connect: { id: genreId } },
          })),
        },
      },
    });

    await AuditService.log({
      userId: adminUserId,
      action: "MOVIE_CREATED",
      entityType: "Movie",
      entityId: movie.id,
      metadata: { title, slug },
    });

    return movie;
  }

  static async updateMovie(
    id: string,
    data: Partial<{
      title: string;
      synopsis: string;
      posterUrl: string;
      bannerUrl: string;
      trailerUrl: string;
      durationMins: number;
      certification: Certification;
      status: MovieStatus;
    }>,
    adminUserId?: string
  ) {
    const movie = await prisma.movie.update({
      where: { id },
      data,
    });

    await AuditService.log({
      userId: adminUserId,
      action: "MOVIE_UPDATED",
      entityType: "Movie",
      entityId: movie.id,
      metadata: data,
    });

    return movie;
  }

  static async deleteMovie(id: string, adminUserId?: string) {
    const movie = await prisma.movie.findUnique({
      where: { id },
      select: { title: true, slug: true },
    });

    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    // Delete associated shows and genre relations
    await prisma.show.deleteMany({ where: { movieId: id } });
    await prisma.movieGenre.deleteMany({ where: { movieId: id } });
    await prisma.movie.delete({ where: { id } });

    await AuditService.log({
      userId: adminUserId,
      action: "MOVIE_DELETED",
      entityType: "Movie",
      entityId: id,
      metadata: { title: movie.title, slug: movie.slug },
    });

    return { success: true, message: `Movie "${movie.title}" deleted.` };
  }
}

