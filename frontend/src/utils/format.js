export function formatDateTime(raw) {
  if (!raw) return null;
  const iso = typeof raw === "string" ? raw.replace(" ", "T") : raw;
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
    hour:  "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(raw) {
  if (!raw) return null;
  const iso = typeof raw === "string" ? raw.replace(" ", "T") : raw;
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(raw) {
  if (!raw) return null;
  const iso = typeof raw === "string" ? raw.replace(" ", "T") : raw;
  const d = new Date(iso);
  return d.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
