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

export interface VerifyHazardResult {
  hazard: RouteHazard;
  userVote: 'still_here' | 'fixed' | null;
  error?: 'not_found' | 'already_voted';
  existingVote?: 'still_here' | 'fixed';
}

export interface DeleteCommentResult {
  success: boolean;
  forbidden?: boolean;
  notFound?: boolean;
}

export interface ReportsRepository {
  // Hazards
  createHazard(data: {
    description: string;
    email?: string;
    position?: { lat: number; lon: number };
    category?: HazardCategory;
  }): Promise<RouteHazard>;

  getHazard(id: string): Promise<RouteHazard | null>;

  listHazards(filter?: {
    bbox?: [number, number, number, number];
    status?: HazardStatus | 'all';
    category?: HazardCategory;
  }): Promise<RouteHazard[]>;

  deleteHazard(id: string): Promise<boolean>;

  // Hazard Verification with Undo
  verifyHazard(hazardId: string, action: HazardVoteAction, voterKey: string): Promise<VerifyHazardResult>;

  // Place Comments
  addPlaceComment(data: {
    placeId: string;
    sentiment: CommentSentiment;
    comment: string;
    category?: PlaceFeatureCategory;
    email?: string;
  }): Promise<PlaceComment | null>;

  listPlaceComments(
    placeId: string,
    sentiment?: CommentSentiment,
    limit?: number,
    offset?: number
  ): Promise<PlaceComment[]>;

  listAllPlaceComments(filter?: {
    bbox?: [number, number, number, number];
    sentiment?: CommentSentiment;
    limit?: number;
  }): Promise<PlaceComment[]>;

  deletePlaceComment(
    placeId: string,
    commentId: string,
    requesterEmail?: string,
    isAdmin?: boolean
  ): Promise<DeleteCommentResult>;

  clearAll?(): Promise<void>;
}
