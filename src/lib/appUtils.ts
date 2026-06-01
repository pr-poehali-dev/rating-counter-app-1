import { Player } from '@/data/store';

export const API_AUTH    = 'https://functions.poehali.dev/60849d96-2815-4a4a-8191-ba7b14448f64';
export const API_PLAYERS = 'https://functions.poehali.dev/bef8ca0b-1403-449d-b4a0-55ffe3af9432';
export const API_GAMES   = 'https://functions.poehali.dev/76b5dfc5-1eb5-46b7-8930-bfefc4e9a5a8';

let nextId = 100;
export function uid() { return String(++nextId); }

export function loadLocal<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

export function saveLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

export function loadAvatarCache(): Record<string, string> {
  return loadLocal<Record<string, string>>('sb_avatar_cache', {});
}

export function saveAvatarToCache(playerId: string, avatar: string) {
  if (!avatar) return;
  const cache = loadAvatarCache();
  cache[playerId] = avatar;
  saveLocal('sb_avatar_cache', cache);
}

// Восстанавливает аватары из кеша только если сервер не вернул аватар
// (сервер возвращает avatar:'' для экономии трафика в списке)
export function mergeAvatars(players: Player[], freshAvatars: Record<string, string> = {}): Player[] {
  const cache = loadAvatarCache();
  return players.map(p => ({
    ...p,
    // freshAvatars (из параллельного запроса) > cache > пусто
    avatar: freshAvatars[p.id] || cache[p.id] || '',
  }));
}