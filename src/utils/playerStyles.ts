export function getStatusClass(status: string) {
  if (status === "現役") {
    return "rounded-full bg-green-500/20 px-3 py-1 text-green-300";
  }

  return "rounded-full bg-red-500/20 px-3 py-1 text-red-300";
}

export function getMovementClass(movement: string) {
  if (movement.includes("▲")) {
    return "rounded-full bg-yellow-500/20 px-3 py-1 text-yellow-300";
  }

  if (movement.includes("▼")) {
    return "rounded-full bg-orange-500/20 px-3 py-1 text-orange-300";
  }

  if (movement.includes("⚕")) {
    return "rounded-full bg-red-500/20 px-3 py-1 text-red-300";
  }

  if (movement.includes("↩")) {
    return "rounded-full bg-blue-500/20 px-3 py-1 text-blue-300";
  }

  if (movement.includes("⇄")) {
    return "rounded-full bg-purple-500/20 px-3 py-1 text-purple-300";
  }

  return "rounded-full bg-slate-500/20 px-3 py-1 text-slate-300";
}