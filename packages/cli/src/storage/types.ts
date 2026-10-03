export type HazardCategory = 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
export type HazardStatus = 'reported' | 'confirmed' | 'resolved';

export interface HazardValidation {
  id: string;
  voterKey: string;
  action: 'still_here' | 'fixed';
  photoUrl?: string;
  comment?: string;
  createdAt: string;
}

export interface RouteHazard {
  id: string;                     // e.g. "hazard-1728000000-xyz"
  description: string;            // Text description of the obstacle
  status: HazardStatus;           // 'reported' (matches LocalReport), 'confirmed', 'resolved'
  createdAt: string;              // ISO 8601 string (matches LocalReport)
  updatedAt: string;              // ISO 8601 string
  email?: string;                 // Required on /api/, optional in storage & on /admin/
  position?: {                    // Free-floating coordinates
    lat: number;
    lon: number;
  };
  category?: HazardCategory;      // 'hole' | 'obstacle' | 'flood' | 'surface' | 'other'
  photoUrl?: string;              // URL of photo evidence
  validations?: HazardValidation[]; // List of photo-based community validations
  stillHereCount: number;         // Count of active "still_here" confirmations
  fixedCount: number;             // Count of active "fixed" confirmations
}

export type HazardVoteAction = 'still_here' | 'fixed' | 'unset';

export interface HazardVoteRecord {
  hazardId: string;
  voterKey: string;               // Normalized email or admin identifier
  currentVote: 'still_here' | 'fixed';
  photoUrl?: string;
  comment?: string;
  updatedAt: string;
}

export type CommentSentiment = 'positive' | 'negative';
export type PlaceFeatureCategory = 'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general';

export interface PlaceComment {
  id: string;                     // e.g. "comm-1728000000-xyz"
  placeId: string;                // e.g. "osm:node:12345678" or "place-sukiennice"
  placeName: string;              // Resolved canonical place name (server-injected)
  position: {                     // Resolved canonical coordinates (server-injected)
    lat: number;
    lon: number;
  };
  sentiment: CommentSentiment;    // 'positive' | 'negative'
  comment: string;                // User feedback text
  category?: PlaceFeatureCategory;// 'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general'
  email?: string;                 // Required on /api/, optional in storage & on /admin/
  photoUrl?: string;              // URL of photo evidence
  createdAt: string;              // ISO 8601 string
}

export interface PlaceInfo {
  id: string;
  name: string;
  position: {
    lat: number;
    lon: number;
  };
}
