import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";
import { slugify } from "@/lib/utils";
import { Certification } from "@prisma/client";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "901ee0fe210d61fb36cbc378c5443e48";
const TMDB_BASE_URL = "https://api.tmdb.org/3";
const TMDB_IMAGE_BASE_POSTER = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BASE_BACKDROP = "https://image.tmdb.org/t/p/original";

export interface TmdbMovieSummary {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
}

export interface TmdbMovieDetails extends TmdbMovieSummary {
  durationMins: number;
  certification: string;
  genres: string[];
  trailerYoutubeKey: string | null;
}

export class TmdbService {
  /**
   * Helper to make robust fetch requests to TMDb API with fallback
   */
  private static async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`TMDb API responded with ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Fetches movies currently playing in Indian cinema halls
   */
  public static async getNowPlaying(page = 1, region = "IN"): Promise<{
    movies: TmdbMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const data = await this.request<{
        page: number;
        total_pages: number;
        total_results: number;
        results: Array<{
          id: number;
          title: string;
          original_title: string;
          overview: string;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string;
          vote_average: number;
          vote_count: number;
          popularity: number;
        }>;
      }>("/movie/now_playing", {
        region,
        page: String(page),
      });

      const movies = data.results.map((m) => ({
        id: m.id,
        title: m.title,
        originalTitle: m.original_title,
        overview: m.overview,
        posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_POSTER}${m.poster_path}` : null,
        backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE_BACKDROP}${m.backdrop_path}` : null,
        releaseDate: m.release_date,
        voteAverage: Math.round(m.vote_average * 10) / 10,
        voteCount: m.vote_count,
        popularity: m.popularity,
      }));

      return {
        movies,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (error) {
      console.error("[TmdbService.getNowPlaying] Error:", error);
      return { movies: [], totalPages: 0, totalResults: 0 };
    }
  }

  /**
   * Fetches upcoming movies releasing in Indian cinema halls
   */
  public static async getUpcoming(page = 1, region = "IN"): Promise<{
    movies: TmdbMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    try {
      const data = await this.request<{
        page: number;
        total_pages: number;
        total_results: number;
        results: Array<{
          id: number;
          title: string;
          original_title: string;
          overview: string;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string;
          vote_average: number;
          vote_count: number;
          popularity: number;
        }>;
      }>("/movie/upcoming", {
        region,
        page: String(page),
      });

      const movies = data.results.map((m) => ({
        id: m.id,
        title: m.title,
        originalTitle: m.original_title,
        overview: m.overview,
        posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_POSTER}${m.poster_path}` : null,
        backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE_BACKDROP}${m.backdrop_path}` : null,
        releaseDate: m.release_date,
        voteAverage: Math.round(m.vote_average * 10) / 10,
        voteCount: m.vote_count,
        popularity: m.popularity,
      }));

      return {
        movies,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (error) {
      console.error("[TmdbService.getUpcoming] Error:", error);
      return { movies: [], totalPages: 0, totalResults: 0 };
    }
  }

  /**
   * Searches TMDb by title
   */
  public static async searchMovies(query: string, page = 1): Promise<{
    movies: TmdbMovieSummary[];
    totalPages: number;
    totalResults: number;
  }> {
    if (!query || query.trim().length === 0) {
      return { movies: [], totalPages: 0, totalResults: 0 };
    }

    try {
      const data = await this.request<{
        page: number;
        total_pages: number;
        total_results: number;
        results: Array<{
          id: number;
          title: string;
          original_title: string;
          overview: string;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string;
          vote_average: number;
          vote_count: number;
          popularity: number;
        }>;
      }>("/search/movie", {
        query: query.trim(),
        page: String(page),
      });

      const movies = data.results.map((m) => ({
        id: m.id,
        title: m.title,
        originalTitle: m.original_title,
        overview: m.overview,
        posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_POSTER}${m.poster_path}` : null,
        backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BASE_BACKDROP}${m.backdrop_path}` : null,
        releaseDate: m.release_date,
        voteAverage: Math.round(m.vote_average * 10) / 10,
        voteCount: m.vote_count,
        popularity: m.popularity,
      }));

      return {
        movies,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      };
    } catch (error) {
      console.error("[TmdbService.searchMovies] Error:", error);
      return { movies: [], totalPages: 0, totalResults: 0 };
    }
  }

  /**
   * Fetches official YouTube trailer video key for a movie
   */
  public static async getTrailerKey(tmdbId: number): Promise<string | null> {
    try {
      const data = await this.request<{
        results: Array<{
          key: string;
          site: string;
          type: string;
          official: boolean;
        }>;
      }>(`/movie/${tmdbId}/videos`);

      // Find official YouTube trailer or teaser
      const trailer =
        data.results.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
        data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
        data.results.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
        data.results.find((v) => v.site === "YouTube");

      return trailer ? trailer.key : null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches complete movie details including runtime, certification, genres, and trailer
   */
  public static async getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails | null> {
    try {
      const [details, releaseDates, trailerKey] = await Promise.all([
        this.request<{
          id: number;
          title: string;
          original_title: string;
          overview: string;
          runtime: number | null;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string;
          vote_average: number;
          vote_count: number;
          popularity: number;
          genres: Array<{ id: number; name: string }>;
        }>(`/movie/${tmdbId}`),
        this.request<{
          results: Array<{
            iso_3166_1: string;
            release_dates: Array<{ certification: string }>;
          }>;
        }>(`/movie/${tmdbId}/release_dates`).catch(() => ({ results: [] })),
        this.getTrailerKey(tmdbId),
      ]);

      // Look for Indian or US certification
      let cert = "UA";
      const inRelease = releaseDates.results.find((r) => r.iso_3166_1 === "IN");
      const usRelease = releaseDates.results.find((r) => r.iso_3166_1 === "US");
      if (inRelease && inRelease.release_dates.length > 0 && inRelease.release_dates[0].certification) {
        cert = inRelease.release_dates[0].certification;
      } else if (usRelease && usRelease.release_dates.length > 0 && usRelease.release_dates[0].certification) {
        cert = usRelease.release_dates[0].certification;
      }

      return {
        id: details.id,
        title: details.title,
        originalTitle: details.original_title,
        overview: details.overview,
        posterUrl: details.poster_path ? `${TMDB_IMAGE_BASE_POSTER}${details.poster_path}` : null,
        backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE_BACKDROP}${details.backdrop_path}` : null,
        releaseDate: details.release_date,
        durationMins: details.runtime || 135,
        certification: cert,
        genres: details.genres.map((g) => g.name),
        voteAverage: Math.round(details.vote_average * 10) / 10,
        voteCount: details.vote_count,
        popularity: details.popularity,
        trailerYoutubeKey: trailerKey,
      };
    } catch (error) {
      console.error("[TmdbService.getMovieDetails] Error:", error);
      return null;
    }
  }

  /**
   * Imports a movie directly from TMDb into CineHub database
   */
  public static async importMovieToDatabase(tmdbId: number, adminUserId?: string) {
    const details = await this.getMovieDetails(tmdbId);
    if (!details) {
      throw new Error("Unable to fetch movie details from TMDb.");
    }

    const baseSlug = slugify(details.title);
    let finalSlug = baseSlug;
    let counter = 1;

    // Check slug collisions
    while (await prisma.movie.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Upsert genres
    const genreRecords = await Promise.all(
      details.genres.map(async (genreName) => {
        const slug = slugify(genreName) || "general";
        return prisma.genre.upsert({
          where: { name: genreName },
          update: {},
          create: { name: genreName, slug },
        });
      })
    );

    // Map certification safely
    let certEnum: Certification = Certification.UA;
    const rawCert = (details.certification || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (rawCert === "U") certEnum = Certification.U;
    else if (rawCert === "A") certEnum = Certification.A;
    else if (rawCert === "S") certEnum = Certification.S;
    else certEnum = Certification.UA;

    // Create the movie in CineHub database
    const movie = await prisma.movie.create({
      data: {
        title: details.title,
        slug: finalSlug,
        synopsis: details.overview || "No synopsis available.",
        posterUrl: details.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
        bannerUrl: details.backdropUrl || details.posterUrl || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c",
        durationMins: details.durationMins || 130,
        certification: certEnum,
        releaseDate: details.releaseDate ? new Date(details.releaseDate) : new Date(),
        status: "NOW_SHOWING",
        genres: {
          create: genreRecords.map((g) => ({
            genreId: g.id,
          })),
        },
      },
      include: {
        genres: {
          include: { genre: true },
        },
      },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: "IMPORT_MOVIE_TMDB",
        entityType: "Movie",
        entityId: movie.id,
        metadata: { tmdbId, title: movie.title, slug: movie.slug },
      });
    }

    return { movie, details };
  }
}
