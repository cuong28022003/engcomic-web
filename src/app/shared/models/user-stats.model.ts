export interface Rank {
  id: string;
  name: string;
  minXp: number;
  maxXp: number;
  badgeUrl?: string;
  color?: string;
}

export interface UserStats {
  id?: string;
  userId: string;
  xp: number;
  diamonds: number;
  diamond?: number;
  streakDays: number;
  currentStreak?: number;
  longestStreak?: number;
  lastStudyDate?: string;
  studiedToday?: boolean;
  isReceivedSeasonReward?: boolean;
  lastLoginDate?: string;
  isPremium?: boolean;
  premiumExpiry?: string;
  premiumExpiredAt?: string;
  rankName?: string;
  rank?: Rank;
  equippedTitle?: string;
  equippedAvatarFrame?: string;
  unlockedTitles?: string[];
  unlockedAvatarFrames?: string[];
  seasonPassLevel?: number;
  seasonPassXp?: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  rank?: Rank;
  position?: number;
  equippedTitle?: string;
  equippedAvatarFrame?: string;
}
