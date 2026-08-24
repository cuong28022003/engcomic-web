export interface Comic {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  genre?: string;
  genres?: string[];
  artist?: string;
  url?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;
  uploaderId?: string;
  uploaderName?: string;
  uploader?: {
    id?: string;
    username?: string;
    email?: string;
    fullName?: string;
    imageUrl?: string;
    roles?: string[];
  };
  views?: number;
  rating?: number;
  totalRatings?: number;
  totalChapters?: number;
  createdAt?: string;
  updatedAt?: string;
  isPremium?: boolean;
  englishLevel?: string;
  ageRating?: string;
}

export interface ComicPage {
  content: Comic[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ComicParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  status?: string;
  genre?: string;
}

export interface Chapter {
  id: string;
  comicId: string;
  chapterNumber: number;
  title?: string;
  images?: string[];
  isPremium?: boolean;
  createdAt?: string;
}

export interface ChapterPage {
  content: Chapter[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
