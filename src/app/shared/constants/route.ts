export const ROUTE = {
  // Wildcard & Root
  ANY: '**',
  MAIN: '',

  // Auth
  LOGIN: 'login',
  REGISTER: 'register',
  ACTIVE: 'active',

  // Public Features
  HOME: '',
  SEARCH: 'search',
  LEADERBOARD: 'leaderboard',

  // User Account
  USER: 'user',
  PROFILE: 'profile',
  CHANGE_PASSWORD: 'change-password',
  RANK: 'rank',
  TOPUP_HISTORY: 'topup-history',

  // Deck & Study
  DECK: 'deck',
  STUDY: 'study',
  RESULT: 'result',

  // Vocab Vault
  VOCAB: 'vocab',

  // Grammar Vault
  GRAMMAR: 'grammar',

  // TOEIC Reader
  READER: 'reader',

  // Admin
  ADMIN: 'admin',
  ADMIN_USERS: 'users',
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
  user: '/user',
  userById: (id: string) => `/user/${id}`,
  profile: '/user/profile',
  changePassword: '/user/change-password',
  rank: '/user/rank',
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
  vocab: '/vocab',
  vocabPractice: '/vocab/practice',
  vocabLeech: '/vocab/leech',
  vocabWord: (id: string) => `/vocab/word/${id}`,
  vocabCollector: '/vocab/collector',
  reader: '/reader',
  readerNew: '/reader/new',
  readerSession: (testId: string) => `/reader/${testId}`,
  readerReview: (testId: string, attemptId: string) =>
    `/reader/${testId}/attempts/${attemptId}/review`,
  admin: '/admin',
  adminUsers: '/admin/users',
  adminReports: '/admin/reports',
  adminRanks: '/admin/ranks',
  adminTopups: '/admin/topups',
};
