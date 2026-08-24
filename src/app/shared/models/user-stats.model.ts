export interface Rank {
  id: string;
  name: string;
  minXp: number;
  maxXp: number;
  badgeUrl?: string;
  color?: string;
}

export interface UserStats {
  userId: string;
  xp: number;
  diamonds: number;
  streakDays: number;
  lastLoginDate?: string;
  isPremium?: boolean;
  premiumExpiry?: string;
  rank?: Rank;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  rank?: Rank;
  position?: number;
}
