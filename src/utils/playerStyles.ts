const BASE_BADGE_CLASS = "rounded-full px-3 py-1";

export function getStatusClass(status: string): string {
  const text = status.trim();

  if (text === "現役") {
    return `${BASE_BADGE_CLASS} bg-green-500/20 text-green-300`;
  }

  if (text === "" || text === "-") {
    return `${BASE_BADGE_CLASS} bg-slate-500/20 text-slate-300`;
  }

  if (text.includes("傷")) {
    return `${BASE_BADGE_CLASS} bg-red-500/20 text-red-300`;
  }

  if (text.includes("復出")) {
    return `${BASE_BADGE_CLASS} bg-blue-500/20 text-blue-300`;
  }

  return `${BASE_BADGE_CLASS} bg-red-500/20 text-red-300`;
}

export function getMovementClass(movement: string): string {
  const text = movement.trim();

  if (text.includes("▲")) {
    return `${BASE_BADGE_CLASS} bg-yellow-500/20 text-yellow-300`;
  }

  if (text.includes("▼")) {
    return `${BASE_BADGE_CLASS} bg-orange-500/20 text-orange-300`;
  }

  if (text.includes("⚕")) {
    return `${BASE_BADGE_CLASS} bg-red-500/20 text-red-300`;
  }

  if (text.includes("↩")) {
    return `${BASE_BADGE_CLASS} bg-blue-500/20 text-blue-300`;
  }

  if (text.includes("⇄")) {
    return `${BASE_BADGE_CLASS} bg-purple-500/20 text-purple-300`;
  }

  if (text === "" || text === "-") {
    return `${BASE_BADGE_CLASS} bg-slate-500/20 text-slate-300`;
  }

  return `${BASE_BADGE_CLASS} bg-slate-500/20 text-slate-300`;
}