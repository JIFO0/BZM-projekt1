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

export class MemoryReportsRepository implements ReportsRepository {
  private hazards = new Map<string, RouteHazard>();
  private votes = new Map<string, HazardVoteRecord>();
  private comments = new Map<string, PlaceComment>();
  private placesRegistry: PlacesRegistry;

  constructor(placesRegistry: PlacesRegistry = defaultPlacesRegistry) {
    this.placesRegistry = placesRegistry;
  }

  public async createHazard(data: {
    description: string;
    email?: string;
    position?: { lat: number; lon: number };
    category?: HazardCategory;
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
      stillHereCount: 0,
      fixedCount: 0,
    };

    this.hazards.set(id, hazard);
    return { ...hazard };
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

    return true;
  }

  public async verifyHazard(
    hazardId: string,
    action: HazardVoteAction,
    voterKey: string
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
        updatedAt: now,
      });
      hazard.updatedAt = now;

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
        updatedAt: now,
      });
      hazard.updatedAt = now;

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
      // If no existing vote, no counter changes

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
      createdAt: now,
    };

    this.comments.set(id, placeComment);
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
    return { success: true };
  }

  public async clearAll(): Promise<void> {
    this.hazards.clear();
    this.votes.clear();
    this.comments.clear();
  }
}
