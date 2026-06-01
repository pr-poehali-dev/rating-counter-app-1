export type Rank = 'rookie' | 'wolf' | 'shark' | 'dragon' | 'skull' | 'queen';

export interface Player {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  joinDate: string;
  isAdmin: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
}

export interface BonusTask {
  id: string;
  name: string;
  points: number;
  completedBy: string[]; // playerIds
}

export interface Game {
  id: string;
  title: string;
  status: 'recruiting' | 'active' | 'finished';
  teams: Team[];
  playerIds: string[]; // все игроки игры (до распределения по командам)
  winnerTeamId: string | null;
  placements: string[]; // teamId[] по местам: [0]=1-е место, [1]=2-е место, ...
  bonusTasks: BonusTask[];
  createdAt: string;
}

export function getRank(points: number): Rank {
  if (points >= 25000) return 'queen';
  if (points >= 20000) return 'skull';
  if (points >= 15000) return 'dragon';
  if (points >= 10000) return 'shark';
  if (points >= 5000) return 'wolf';
  return 'rookie';
}

export function getRankLabel(rank: Rank): string {
  const labels: Record<Rank, string> = {
    rookie: 'Новобранец',
    wolf: 'Волк',
    shark: 'Акула',
    dragon: 'Дракон',
    skull: 'Владыка',
    queen: 'Фантом',
  };
  return labels[rank];
}

export function getRankEmoji(rank: Rank): string {
  const emojis: Record<Rank, string> = {
    rookie: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/e7a7031a-aca7-4491-bcc2-14c2086ce132.png',
    wolf: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/4db688e7-c3fb-469f-af8c-82790cf63902.png',
    shark: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/8f89b1e6-90d8-466e-a04f-fddb6cd10743.png',
    dragon: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/b5ded5b4-9f99-4143-a2d0-f14ce6c8fe95.png',
    skull: 'https://cdn.poehali.dev/projects/54777fdb-66a9-4dc5-8e35-68f29c84a0ae/bucket/39af4433-12b1-43ff-b15d-cfde6640b51d.png',
    queen: '👸',
  };
  return emojis[rank];
}

export function isRankImage(val: string): boolean {
  return val.startsWith('http');
}

export function getRankThreshold(rank: Rank): number {
  const thresholds: Record<Rank, number> = {
    rookie: 0,
    wolf: 5000,
    shark: 10000,
    dragon: 15000,
    skull: 20000,
    queen: 25000,
  };
  return thresholds[rank];
}

export function getNextRankThreshold(points: number): number {
  if (points < 5000) return 5000;
  if (points < 10000) return 10000;
  if (points < 15000) return 15000;
  if (points < 20000) return 20000;
  if (points < 25000) return 25000;
  return 25000;
}

// Players — populated at runtime via login
export const initialPlayers: Player[] = [];

export const TEAM_COLORS = [
  { value: '#E53935', label: 'Красный' },
  { value: '#1E88E5', label: 'Синий' },
  { value: '#43A047', label: 'Зелёный' },
  { value: '#FDD835', label: 'Жёлтый' },
  { value: '#8E24AA', label: 'Фиолетовый' },
  { value: '#FF6F00', label: 'Оранжевый' },
];