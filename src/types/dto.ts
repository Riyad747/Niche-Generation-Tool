/** Shared DTOs between API and client. Mirrors selected Prisma fields. */

export type SessionStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'PARTIAL';
export type SaturationLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type GrowthState = 'EMERGING' | 'RISING' | 'EXPLOSIVE' | 'STABLE' | 'DECLINING';

export interface SessionDto {
  id: string;
  seed: string;
  status: SessionStatus;
  progress: number;
  error: string | null;
  nicheCount?: number;
  createdAt: string;
}

export interface NicheDto {
  id: string;
  sessionId: string;
  parentId: string | null;
  path: string;
  depth: number;
  kind: string;
  name: string;
  description: string | null;
  demandScore: number;
  competitionScore: number;
  trendScore: number;
  seasonalityScore: number;
  aiCompatScore: number;
  vectorCompatScore: number;
  commercialSafetyScore: number;
  approvalProbabilityScore: number;
  opportunityScore: number;
  growthState: GrowthState | null;
  saturation: SaturationLevel | null;
}

export interface NicheContentDto {
  keywords: { term: string; kind: string; score: number }[];
  titles: { text: string; kind: string }[];
  ideas: { title: string; assetType: string; prompt: string }[];
}
