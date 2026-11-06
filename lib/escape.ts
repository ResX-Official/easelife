export const ESCAPE_VIBES = [
  { value: "any", label: "A little of everything" },
  { value: "calm", label: "Quiet & calm" },
  { value: "pool", label: "Poolside weekends" },
  { value: "beach", label: "Beach escapes" },
  { value: "romantic", label: "Time for two" },
  { value: "celebration", label: "Celebrate together" },
];
export const ROOM_LIFETIME_MS = 30 * 86400000;
export type EscapeVoteValue = 0 | 1 | 2;
export function estimatedPerPerson(price: number, frequency: string, nights: number, groupSize: number) {
  if (frequency !== "daily" && frequency !== "per_stay") throw new RangeError("Escape Match requires a daily or per-stay accommodation rate.");
  return Math.ceil(price * (frequency === "per_stay" ? 1 : nights) / groupSize);
}
export function rankEscapeOptions<T extends { id: string; votes: { value: number }[] }>(options: T[], memberCount: number) {
  return options.map(option => {
    const yes = option.votes.filter(v => v.value === 2).length;
    const maybe = option.votes.filter(v => v.value === 1).length;
    return { ...option, yes, maybe, score: yes * 2 + maybe, unanimous: memberCount >= 2 && yes === memberCount && option.votes.length === memberCount };
  }).filter(option => option.score > 0).sort((a,b) => Number(b.unanimous) - Number(a.unanimous) || b.score - a.score || b.yes - a.yes || a.id.localeCompare(b.id));
}
