export interface DeckStats {
  totalCards: number;
  totalNew: number;
  totalEasy: number;
  totalHard: number;
  totalDue: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  icon?: string;
  background?: string;
  totalCards?: number;
  stats?: DeckStats;
  createdAt?: string;
  createAt?: string;
  updateAt?: string;
}
