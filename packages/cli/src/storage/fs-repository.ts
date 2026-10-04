import fs from 'node:fs';
import path from 'node:path';
import type {
  RouteHazard,
  HazardVoteAction,
  HazardVoteRecord,
  PlaceComment,
  HazardCategory,
  HazardStatus,
  CommentSentiment,
  PlaceFeatureCategory,
} from './types';
import type { ReportsRepository, VerifyHazardResult, DeleteCommentResult } from './repository';
import { PlacesRegistry, defaultPlacesRegistry } from './places-registry';
import { MemoryReportsRepository } from './memory-repository';

export interface FsReportsRepositoryOptions {
  dataDir?: string;
  placesRegistry?: PlacesRegistry;
  seedInitialData?: boolean;
}

/**
 * File-system backed repository for Route Hazards, Verification Votes, and Place Comments.
 * Keeps an in-memory cache for ultra-fast queries and atomically persists data to JSON files on disk.
 */
export class FsReportsRepository implements ReportsRepository {
  private dataDir: string;
  private placesRegistry: PlacesRegistry;
  private hazards = new Map<string, RouteHazard>();
  private votes = new Map<string, HazardVoteRecord>();
  private comments = new Map<string, PlaceComment>();

  private hazardsFile: string;
  private votesFile: string;
  private commentsFile: string;

  constructor(options: FsReportsRepositoryOptions = {}) {
    this.dataDir =
      options.dataDir ||
      process.env.STORAGE_DIR ||
      process.env.REPORTS_DATA_DIR ||
      path.join(process.cwd(), 'data', 'reports');
    this.placesRegistry = options.placesRegistry ?? defaultPlacesRegistry;

    this.ensureDirectory(this.dataDir);

    this.hazardsFile = path.join(this.dataDir, 'hazards.json');
    this.votesFile = path.join(this.dataDir, 'votes.json');
    this.commentsFile = path.join(this.dataDir, 'comments.json');

    this.loadFromDisk();

    if (options.seedInitialData !== false && this.hazards.size === 0) {
      this.seedDefaultHazards();
    }
  }

  private ensureDirectory(dir: string): void {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Non-fatal
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.hazardsFile)) {
        const raw = fs.readFileSync(this.hazardsFile, 'utf-8');
        const list: RouteHazard[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.hazards.clear();
          for (const item of list) {
            this.hazards.set(item.id, item);
          }
        }
      }
    } catch (err) {
      console.warn(`[FsReportsRepository] Failed to read ${this.hazardsFile}:`, err);
    }

    try {
      if (fs.existsSync(this.votesFile)) {
        const raw = fs.readFileSync(this.votesFile, 'utf-8');
        const list: Array<{ key: string; record: HazardVoteRecord }> = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.votes.clear();
          for (const item of list) {
            this.votes.set(item.key, item.record);
          }
        }
      }
    } catch (err) {
      console.warn(`[FsReportsRepository] Failed to read ${this.votesFile}:`, err);
    }

    try {
      if (fs.existsSync(this.commentsFile)) {
        const raw = fs.readFileSync(this.commentsFile, 'utf-8');
        const list: PlaceComment[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.comments.clear();
          for (const item of list) {
            this.comments.set(item.id, item);
          }
        }
      }
    } catch (err) {
      console.warn(`[FsReportsRepository] Failed to read ${this.commentsFile}:`, err);
    }
  }

  private saveHazardsAndVotes(): void {
    this.ensureDirectory(this.dataDir);

    try {
      const hazardsList = Array.from(this.hazards.values());
      const tempHazards = `${this.hazardsFile}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tempHazards, JSON.stringify(hazardsList, null, 2), 'utf-8');
      fs.renameSync(tempHazards, this.hazardsFile);
    } catch (err) {
      console.error(`[FsReportsRepository] Failed to save ${this.hazardsFile}:`, err);
    }

    try {
      const votesList = Array.from(this.votes.entries()).map(([key, record]) => ({ key, record }));
      const tempVotes = `${this.votesFile}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tempVotes, JSON.stringify(votesList, null, 2), 'utf-8');
      fs.renameSync(tempVotes, this.votesFile);
    } catch (err) {
      console.error(`[FsReportsRepository] Failed to save ${this.votesFile}:`, err);
    }
  }

  private saveComments(): void {
    this.ensureDirectory(this.dataDir);

    try {
      const commentsList = Array.from(this.comments.values());
      const tempComments = `${this.commentsFile}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tempComments, JSON.stringify(commentsList, null, 2), 'utf-8');
      fs.renameSync(tempComments, this.commentsFile);
    } catch (err) {
      console.error(`[FsReportsRepository] Failed to save ${this.commentsFile}:`, err);
    }
  }

  public async createHazard(data: {
    description: string;
    email?: string;
    position?: { lat: number; lon: number };
    category?: HazardCategory;
    photoUrl?: string;
  }): Promise<RouteHazard> {
    const id = `hazard-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const hazard: RouteHazard = {
      id,
      description: data.description,
      status: 'reported',
      createdAt: now,
      updatedAt: now,
      email: data.email,
      position: data.position,
      category: data.category,
      photoUrl: data.photoUrl,
      validations: [],
      stillHereCount: 0,
      fixedCount: 0,
    };

    this.hazards.set(id, hazard);
    this.saveHazardsAndVotes();
    return { ...hazard };
  }

  public async getRandomHazard(): Promise<RouteHazard | null> {
    const list = Array.from(this.hazards.values());
    if (list.length === 0) return null;
    const index = Math.floor(Math.random() * list.length);
    return { ...list[index]! };
  }

  public async getHazard(id: string): Promise<RouteHazard | null> {
    const h = this.hazards.get(id);
    return h ? { ...h } : null;
  }

  public async listHazards(filter?: {
    bbox?: [number, number, number, number];
    status?: HazardStatus | 'all';
    category?: HazardCategory;
  }): Promise<RouteHazard[]> {
    let result = Array.from(this.hazards.values());

    if (filter?.status && filter.status !== 'all') {
      result = result.filter((h) => h.status === filter.status);
    }

    if (filter?.category) {
      result = result.filter((h) => h.category === filter.category);
    }

    if (filter?.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filter.bbox;
      result = result.filter((h) => {
        if (!h.position) return false;
        return (
          h.position.lon >= minLon &&
          h.position.lon <= maxLon &&
          h.position.lat >= minLat &&
          h.position.lat <= maxLat
        );
      });
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result.map((h) => ({ ...h }));
  }

  public async deleteHazard(id: string): Promise<boolean> {
    const exists = this.hazards.has(id);
    if (!exists) {
      return false;
    }

    this.hazards.delete(id);

    // Clean up associated votes
    for (const [key, vote] of this.votes.entries()) {
      if (vote.hazardId === id) {
        this.votes.delete(key);
      }
    }

    this.saveHazardsAndVotes();
    return true;
  }

  public async verifyHazard(
    hazardId: string,
    action: HazardVoteAction,
    voterKey: string,
    options?: { photoUrl?: string; comment?: string }
  ): Promise<VerifyHazardResult> {
    const hazard = this.hazards.get(hazardId);
    if (!hazard) {
      return {
        hazard: null as unknown as RouteHazard,
        userVote: null,
        error: 'not_found',
      };
    }

    const normKey = voterKey.trim().toLowerCase();
    const voteKey = `${hazardId}::${normKey}`;
    const existing = this.votes.get(voteKey);

    const now = new Date().toISOString();

    if (action === 'still_here') {
      if (existing?.currentVote === 'still_here') {
        return {
          hazard: { ...hazard },
          userVote: 'still_here',
          error: 'already_voted',
          existingVote: 'still_here',
        };
      }

      if (existing?.currentVote === 'fixed') {
        hazard.fixedCount = Math.max(0, hazard.fixedCount - 1);
        hazard.stillHereCount += 1;
      } else {
        hazard.stillHereCount += 1;
      }

      this.votes.set(voteKey, {
        hazardId,
        voterKey: normKey,
        currentVote: 'still_here',
        photoUrl: options?.photoUrl,
        comment: options?.comment,
        updatedAt: now,
      });
      hazard.updatedAt = now;

      if (!hazard.validations) hazard.validations = [];
      if (options?.photoUrl || options?.comment) {
        hazard.validations.push({
          id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          voterKey: normKey,
          action: 'still_here',
          photoUrl: options.photoUrl,
          comment: options.comment,
          createdAt: now,
        });
      }
      if (options?.photoUrl) {
        hazard.photoUrl = options.photoUrl;
      }

      this.saveHazardsAndVotes();
      return {
        hazard: { ...hazard },
        userVote: 'still_here',
      };
    }

    if (action === 'fixed') {
      if (existing?.currentVote === 'fixed') {
        return {
          hazard: { ...hazard },
          userVote: 'fixed',
          error: 'already_voted',
          existingVote: 'fixed',
        };
      }

      if (existing?.currentVote === 'still_here') {
        hazard.stillHereCount = Math.max(0, hazard.stillHereCount - 1);
        hazard.fixedCount += 1;
      } else {
        hazard.fixedCount += 1;
      }

      this.votes.set(voteKey, {
        hazardId,
        voterKey: normKey,
        currentVote: 'fixed',
        photoUrl: options?.photoUrl,
        comment: options?.comment,
        updatedAt: now,
      });
      hazard.updatedAt = now;

      if (!hazard.validations) hazard.validations = [];
      if (options?.photoUrl || options?.comment) {
        hazard.validations.push({
          id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          voterKey: normKey,
          action: 'fixed',
          photoUrl: options.photoUrl,
          comment: options.comment,
          createdAt: now,
        });
      }
      if (options?.photoUrl) {
        hazard.photoUrl = options.photoUrl;
      }

      this.saveHazardsAndVotes();
      return {
        hazard: { ...hazard },
        userVote: 'fixed',
      };
    }

    if (action === 'unset') {
      if (existing?.currentVote === 'still_here') {
        hazard.stillHereCount = Math.max(0, hazard.stillHereCount - 1);
        this.votes.delete(voteKey);
        hazard.updatedAt = now;
      } else if (existing?.currentVote === 'fixed') {
        hazard.fixedCount = Math.max(0, hazard.fixedCount - 1);
        this.votes.delete(voteKey);
        hazard.updatedAt = now;
      }

      this.saveHazardsAndVotes();
      return {
        hazard: { ...hazard },
        userVote: null,
      };
    }

    return {
      hazard: { ...hazard },
      userVote: existing?.currentVote ?? null,
    };
  }

  public async addPlaceComment(data: {
    placeId: string;
    sentiment: CommentSentiment;
    comment: string;
    category?: PlaceFeatureCategory;
    email?: string;
    photoUrl?: string;
  }): Promise<PlaceComment | null> {
    const place = this.placesRegistry.getPlace(data.placeId);
    if (!place) {
      return null;
    }

    const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const placeComment: PlaceComment = {
      id,
      placeId: place.id,
      placeName: place.name,
      position: {
        lat: place.position.lat,
        lon: place.position.lon,
      },
      sentiment: data.sentiment,
      comment: data.comment,
      category: data.category,
      email: data.email,
      photoUrl: data.photoUrl,
      createdAt: now,
    };

    this.comments.set(id, placeComment);
    this.saveComments();
    return { ...placeComment };
  }

  public async listPlaceComments(
    placeId: string,
    sentiment?: CommentSentiment,
    limit: number = 50,
    offset: number = 0
  ): Promise<PlaceComment[]> {
    const place = this.placesRegistry.getPlace(placeId);
    const targetPlaceId = place ? place.id : placeId;

    let result = Array.from(this.comments.values()).filter((c) => c.placeId === targetPlaceId);

    if (sentiment) {
      result = result.filter((c) => c.sentiment === sentiment);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result.slice(offset, offset + limit).map((c) => ({ ...c }));
  }

  public async listAllPlaceComments(filter?: {
    bbox?: [number, number, number, number];
    sentiment?: CommentSentiment;
    limit?: number;
  }): Promise<PlaceComment[]> {
    let result = Array.from(this.comments.values());

    if (filter?.sentiment) {
      result = result.filter((c) => c.sentiment === filter.sentiment);
    }

    if (filter?.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filter.bbox;
      result = result.filter((c) => {
        return (
          c.position.lon >= minLon &&
          c.position.lon <= maxLon &&
          c.position.lat >= minLat &&
          c.position.lat <= maxLat
        );
      });
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const limit = filter?.limit ?? 100;
    return result.slice(0, limit).map((c) => ({ ...c }));
  }

  public async deletePlaceComment(
    placeId: string,
    commentId: string,
    requesterEmail?: string,
    isAdmin?: boolean
  ): Promise<DeleteCommentResult> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return { success: false, notFound: true };
    }

    const place = this.placesRegistry.getPlace(placeId);
    const canonicalPlaceId = place ? place.id : placeId;
    if (comment.placeId !== canonicalPlaceId && comment.placeId !== placeId) {
      return { success: false, notFound: true };
    }

    if (!isAdmin) {
      if (!requesterEmail || !comment.email) {
        return { success: false, forbidden: true };
      }
      if (requesterEmail.trim().toLowerCase() !== comment.email.trim().toLowerCase()) {
        return { success: false, forbidden: true };
      }
    }

    this.comments.delete(commentId);
    this.saveComments();
    return { success: true };
  }

  public async clearAll(): Promise<void> {
    this.hazards.clear();
    this.votes.clear();
    this.comments.clear();
    this.saveHazardsAndVotes();
    this.saveComments();
  }

  public seedDefaultHazards(): void {
    if (this.hazards.size > 0) return;

    const sampleHazards: Array<Omit<RouteHazard, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        description: 'Wysoki krawężnik (14 cm) bez zjazdu na przejściu dla pieszych przy Rynku Głównym',
        status: 'reported',
        category: 'obstacle',
        position: { lat: 50.0619, lon: 19.9373 },
        stillHereCount: 4,
        fixedCount: 0,
        photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60',
        validations: [
          {
            id: 'val-seed-1',
            voterKey: 'audytor@krakow.pl',
            action: 'still_here',
            comment: 'Potwierdzam, brak obniżenia krawężnika.',
            photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60',
            createdAt: '2026-10-03T10:00:00Z',
          },
        ],
      },
      {
        description: 'Głęboka wyrwa i popękane płyty chodnikowe na ul. Floriańskiej',
        status: 'confirmed',
        category: 'hole',
        position: { lat: 50.0631, lon: 19.9401 },
        stillHereCount: 6,
        fixedCount: 1,
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
        validations: [
          {
            id: 'val-seed-2',
            voterKey: 'mieszkaniec@krakow.pl',
            action: 'still_here',
            comment: 'Koło wózka utknęło w szczelinie.',
            photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60',
            createdAt: '2026-10-03T12:30:00Z',
          },
        ],
      },
      {
        description: 'Zalane przejście podziemne przy Dworcu Głównym po deszczu',
        status: 'reported',
        category: 'flood',
        position: { lat: 50.0664, lon: 19.9482 },
        stillHereCount: 3,
        fixedCount: 0,
        photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=60',
      },
      {
        description: 'Nierówny, stary bruk kamienny uniemożliwiający przejazd wózkiem na ul. Kanoniczej',
        status: 'reported',
        category: 'surface',
        position: { lat: 50.0563, lon: 19.9371 },
        stillHereCount: 5,
        fixedCount: 0,
        photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=60',
      },
    ];

    const now = new Date().toISOString();
    sampleHazards.forEach((sh, idx) => {
      const id = `hazard-sample-${idx + 1}`;
      this.hazards.set(id, {
        ...sh,
        id,
        createdAt: now,
        updatedAt: now,
        validations: sh.validations || [],
      });
    });

    this.saveHazardsAndVotes();
  }
}
