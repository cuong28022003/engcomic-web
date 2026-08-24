export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  value?: number;
}

export interface GachaCharacter {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  imageUrl?: string;
  spriteUrl?: string;
  skills?: CharacterSkill[];
  description?: string;
  version?: string;
}

export interface UserCharacter {
  id: string;
  userId: string;
  character: GachaCharacter;
  quantity?: number;
  acquiredAt?: string;
}
