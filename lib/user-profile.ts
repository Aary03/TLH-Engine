const STORAGE_KEY = "valura_profile";

export interface ValuraProfile {
  incomeBracket: "up_to_50L" | "50L_to_1Cr" | "1Cr_to_2Cr" | "2Cr_to_5Cr" | "above_5Cr";
  investorType: "resident" | "nri" | "foreign";
  taxRegime: "new" | "old";
  familyMembers: { name: string; fyRemittedINR: number }[];
  incomeAbove5Cr: boolean;
  lastUpdated: string;
}

export const DEFAULT_PROFILE: ValuraProfile = {
  incomeBracket: "above_5Cr",
  investorType: "resident",
  taxRegime: "new",
  familyMembers: [{ name: "You", fyRemittedINR: 0 }],
  incomeAbove5Cr: false,
  lastUpdated: new Date().toISOString(),
};

export function getProfile(): ValuraProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(updates: Partial<ValuraProfile>): void {
  if (typeof window === "undefined") return;
  const current = getProfile();
  const merged: ValuraProfile = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function profileExists(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Bracket label helpers ── */
export const BRACKET_LABELS: Record<ValuraProfile["incomeBracket"], string> = {
  up_to_50L:  "Up to ₹50L",
  "50L_to_1Cr": "₹50L – ₹1 Cr",
  "1Cr_to_2Cr": "₹1 Cr – ₹2 Cr",
  "2Cr_to_5Cr": "₹2 Cr – ₹5 Cr",
  above_5Cr:  "Above ₹5 Cr",
};

/** Maps ValuraProfile bracket → calculator bracket strings */
export function profileBracketToCalcBracket(
  bracket: ValuraProfile["incomeBracket"]
): string {
  const map: Record<ValuraProfile["incomeBracket"], string> = {
    up_to_50L:    "10-50l",
    "50L_to_1Cr": "50l-1cr",
    "1Cr_to_2Cr": "1-2cr",
    "2Cr_to_5Cr": "2-5cr",
    above_5Cr:    "5cr+",
  };
  return map[bracket];
}

/** Human-readable summary for display in sidebar */
export function profileSummary(p: ValuraProfile): string {
  const type = { resident: "Resident Indian", nri: "NRI", foreign: "Foreign" }[p.investorType];
  const bracket = BRACKET_LABELS[p.incomeBracket];
  return `${type} · ${bracket} · ${p.taxRegime === "new" ? "New regime" : "Old regime"} · ${p.familyMembers.length} member${p.familyMembers.length > 1 ? "s" : ""}`;
}
