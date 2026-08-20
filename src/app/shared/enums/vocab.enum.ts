export enum CardStatus {
  NEW = 'new',
  LEARNING = 'learning',
  MATURE = 'mature',
  LEECH = 'leech',
}

export enum RelationType {
  FAMILY = 'family',
  COLLOCATION = 'collocation',
  SYNONYM = 'synonym',
}

export enum FormalityLevel {
  ALL = 'all',
  FORMAL = 'formal',
  INFORMAL = 'informal',
  WRITTEN = 'written',
}

export enum PracticeStage {
  STAGE_0 = 0, // Mới
  STAGE_1 = 1, // Nhận biết
  STAGE_2 = 2, // Ngữ cảnh & sắc thái
  STAGE_3 = 3, // Phát âm
  STAGE_4 = 4, // Sản sinh có hỗ trợ
  STAGE_5 = 5, // Sản sinh tự do
  STAGE_6 = 6, // Ứng dụng thực tế
}
