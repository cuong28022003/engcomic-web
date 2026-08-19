export const ROUTE = {
  // Auth
  LOGIN: 'login',
  REGISTER: 'register',
  ACTIVE: 'active',

  // Home
  HOME: '',
  SEARCH: 'search',
  LEADERBOARD: 'leaderboard',

  // Comics
  COMICS: 'comics',
  COMIC_DETAIL: ':comicId',
  COMIC_CREATE: 'create',
  COMIC_EDIT: ':comicId/edit',

  // Chapters
  CHAPTERS: 'chapters',
  CHAPTER_DETAIL: ':chapterId',
  CHAPTER_CREATE: 'create',
  CHAPTER_EDIT: ':chapterId/edit',

  // Account
  USER: 'user',
  PROFILE: 'profile',
  CHANGE_PASSWORD: 'change-password',
  BOOKSHELF: 'bookshelf',
  RANK: 'rank',
  COLLECTION: 'collection',
  TOPUP_HISTORY: 'topup-history',

  // Deck
  DECK: 'deck',
  DECK_CREATE: 'create',
  DECK_DETAIL: ':deckId',
  DECK_EDIT: ':deckId/edit',
  CARD_CREATE: ':deckId/create-card',
  CARD_EDIT: ':deckId/edit-card/:cardId',

  // Study
  STUDY: 'study',
  RESULT: 'result',

  // Gacha
  GACHA: 'gacha',

  // Premium
  PREMIUM: 'upgrade-premium',
  DIAMOND_TOPUP: 'diamond-topup',

  // Game
  FIGHTING_GAME: 'fighting-game',

  // Admin
  ADMIN: 'admin',
  ADMIN_USERS: 'users',
  ADMIN_COMICS: 'comics',
  ADMIN_REPORTS: 'reports',
  ADMIN_RANKS: 'ranks',
  ADMIN_TOPUPS: 'topups',
} as const;

// Full path helpers
export const FULL_ROUTE = {
  home: '/',
  login: '/login',
  register: '/register',
  search: '/search',
  leaderboard: '/leaderboard',
  comics: '/comics',
  comicDetail: (id: string) => `/comics/${id}`,
  comicCreate: '/comics/create',
  comicEdit: (id: string) => `/comics/${id}/edit`,
  chapterDetail: (comicId: string, chapterId: string) =>
    `/comics/${comicId}/chapters/${chapterId}`,
  chapterCreate: (comicId: string) => `/comics/${comicId}/chapters/create`,
  chapterEdit: (comicId: string, chapterId: string) =>
    `/comics/${comicId}/chapters/${chapterId}/edit`,
  user: '/user',
  userById: (id: string) => `/user/${id}`,
  profile: '/user/profile',
  changePassword: '/user/change-password',
  bookshelf: '/user/bookshelf',
  rank: '/user/rank',
  collection: '/user/collection',
  topupHistory: '/user/topup-history',
  deck: '/deck',
  deckCreate: '/deck/create',
  deckDetail: (id: string) => `/deck/${id}`,
  deckEdit: (id: string) => `/deck/${id}/edit`,
  cardCreate: (deckId: string) => `/deck/${deckId}/create-card`,
  cardEdit: (deckId: string, cardId: string) =>
    `/deck/${deckId}/edit-card/${cardId}`,
  study: (deckId: string) => `/study/${deckId}`,
  result: (deckId: string) => `/result/${deckId}`,
  gacha: '/gacha',
  premium: '/upgrade-premium',
  diamondTopup: '/diamond-topup',
  fightingGame: '/fighting-game',
  admin: '/admin',
};
