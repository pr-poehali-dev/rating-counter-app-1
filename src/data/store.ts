export type Rank = 'rookie' | 'wolf' | 'shark' | 'dragon' | 'skull' | 'queen';

export interface Player {
  id: string;
  name: string;
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
    queen: 'Королева тьмы',
  };
  return labels[rank];
}

export function getRankEmoji(rank: Rank): string {
  const emojis: Record<Rank, string> = {
    rookie: '🎯',
    wolf: '🐺',
    shark: '🦈',
    dragon: '🐉',
    skull: '💀',
    queen: '👸',
  };
  return emojis[rank];
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

// Initial demo data
export const initialPlayers: Player[] = [
  {
    id: '1',
    name: 'Дмитрий Ильин',
    avatar: '',
    points: 18400,
    wins: 32,
    losses: 8,
    gamesPlayed: 40,
    joinDate: '2024-01-15',
    isAdmin: true,
  },
  {
    id: '2',
    name: 'Алексей Громов',
    avatar: '',
    points: 12750,
    wins: 24,
    losses: 10,
    gamesPlayed: 34,
    joinDate: '2024-02-20',
    isAdmin: false,
  },
  {
    id: '3',
    name: 'Максим Кравцов',
    avatar: '',
    points: 9200,
    wins: 18,
    losses: 14,
    gamesPlayed: 32,
    joinDate: '2024-03-05',
    isAdmin: false,
  },
  {
    id: '4',
    name: 'Сергей Волков',
    avatar: '',
    points: 6100,
    wins: 12,
    losses: 10,
    gamesPlayed: 22,
    joinDate: '2024-04-10',
    isAdmin: false,
  },
  {
    id: '5',
    name: 'Игорь Платов',
    avatar: '',
    points: 4300,
    wins: 8,
    losses: 12,
    gamesPlayed: 20,
    joinDate: '2024-05-01',
    isAdmin: false,
  },
  {
    id: '6',
    name: 'Николай Архипов',
    avatar: '',
    points: 2800,
    wins: 5,
    losses: 9,
    gamesPlayed: 14,
    joinDate: '2024-06-12',
    isAdmin: false,
  },
  {
    id: '7',
    name: 'Артём Белов',
    avatar: '',
    points: 1500,
    wins: 3,
    losses: 7,
    gamesPlayed: 10,
    joinDate: '2024-07-18',
    isAdmin: false,
  },
];

export const TEAM_COLORS = [
  { value: '#E53935', label: 'Красный' },
  { value: '#1E88E5', label: 'Синий' },
  { value: '#43A047', label: 'Зелёный' },
  { value: '#FDD835', label: 'Жёлтый' },
  { value: '#8E24AA', label: 'Фиолетовый' },
  { value: '#FF6F00', label: 'Оранжевый' },
];
