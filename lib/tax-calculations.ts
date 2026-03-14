/**
 * Complete Indian tax calculation engine for IFSC/overseas fund investments
 * Covers: STCG/LTCG, surcharge, cess, TCS, and LRS optimization
 */

export type TaxRegime = "old" | "new";
export type GainType = "STCG" | "LTCG";
export type LRSPurpose =
  | "investment"
  | "education_loan"
  | "education_self"
  | "medical"
  | "tour_package"
  | "gift"
  | "maintenance";

// ─── Surcharge rates ───────────────────────────────────────────────────────

export function getSurchargeRate(income: number, regime: TaxRegime = "old"): number {
  if (income <= 5_000_000) return 0;
  if (income <= 10_000_000) return 0.10;
  if (income <= 20_000_000) return 0.15;
  if (income <= 50_000_000) return 0.25;
  return regime === "old" ? 0.37 : 0.25;
}

export function getSlabRate(income: number, regime: TaxRegime = "old"): number {
  if (regime === "new") {
    if (income <= 300_000) return 0;
    if (income <= 700_000) return 0.05;
    if (income <= 1_000_000) return 0.10;
    if (income <= 1_200_000) return 0.15;
    if (income <= 1_500_000) return 0.20;
    return 0.30;
  }
  // Old regime
  if (income <= 250_000) return 0;
  if (income <= 500_000) return 0.05;
  if (income <= 1_000_000) return 0.20;
  return 0.30;
}

// ─── Capital gains effective rates ────────────────────────────────────────

/**
 * LTCG on IFSC/overseas funds: 12.5% flat, surcharge CAPPED at 15%, 4% cess
 * Max effective: 12.5% × 1.15 × 1.04 = 14.95%
 */
export function getLTCGEffectiveRate(income: number, regime: TaxRegime = "old"): number {
  const surcharge = Math.min(getSurchargeRate(income, regime), 0.15); // Cap at 15%
  return 0.125 * (1 + surcharge) * 1.04;
}

/**
 * STCG on IFSC/overseas funds: at slab rate, NO surcharge cap, 4% cess
 * Max effective (old): 30% × 1.37 × 1.04 = 42.744%
 */
export function getSTCGEffectiveRate(income: number, regime: TaxRegime = "old"): number {
  const slabRate = getSlabRate(income, regime);
  const surcharge = getSurchargeRate(income, regime); // No cap for STCG
  return slabRate * (1 + surcharge) * 1.04;
}

export interface TaxRateBreakdown {
  baseRate: number;
  surchargeRate: number;
  cessRate: number;
  effectiveRate: number;
  gainType: GainType;
  holdingDays: number;
  isLTCG: boolean;
}

export function calculateTaxRateBreakdown(
  holdingDays: number,
  income: number,
  regime: TaxRegime = "old"
): TaxRateBreakdown {
  const isLTCG = holdingDays > 730;

  if (isLTCG) {
    const surchargeRate = Math.min(getSurchargeRate(income, regime), 0.15);
    return {
      baseRate: 0.125,
      surchargeRate,
      cessRate: 0.04,
      effectiveRate: getLTCGEffectiveRate(income, regime),
      gainType: "LTCG",
      holdingDays,
      isLTCG: true,
    };
  } else {
    const baseRate = getSlabRate(income, regime);
    const surchargeRate = getSurchargeRate(income, regime);
    return {
      baseRate,
      surchargeRate,
      cessRate: 0.04,
      effectiveRate: getSTCGEffectiveRate(income, regime),
      gainType: "STCG",
      holdingDays,
      isLTCG: false,
    };
  }
}

// ─── Capital gains calculator ─────────────────────────────────────────────

export interface CGCalcInput {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyDate: Date;
  sellDate: Date;
  income: number;
  regime?: TaxRegime;
  exchangeRate?: number;
}

export interface CGCalcResult {
  gainType: GainType;
  holdingDays: number;
  gainAmount: number;
  taxableGain: number;
  taxAmount: number;
  rateBreakdown: TaxRateBreakdown;
  netProceeds: number;
  isLoss: boolean;
  lossCarryForwardValue: number; // Tax saved if offset against existing gains
}

export function calculateCapitalGains(input: CGCalcInput): CGCalcResult {
  const { buyPrice, sellPrice, quantity, buyDate, sellDate, income, regime = "old", exchangeRate = 83.5 } = input;

  const holdingDays = Math.floor(
    (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const gainPerUnit = (sellPrice - buyPrice) * exchangeRate;
  const gainAmount = gainPerUnit * quantity;
  const isLoss = gainAmount < 0;

  const rateBreakdown = calculateTaxRateBreakdown(holdingDays, income, regime);
  const taxableGain = Math.max(0, gainAmount);
  const taxAmount = taxableGain * rateBreakdown.effectiveRate;
  const netProceeds = sellPrice * quantity * exchangeRate - taxAmount;

  // Value of loss for carry-forward (can offset future gains)
  const stcgRate = getSTCGEffectiveRate(income, regime);
  const lossCarryForwardValue = Math.abs(Math.min(0, gainAmount)) * (rateBreakdown.isLTCG ? getLTCGEffectiveRate(income, regime) : stcgRate);

  return {
    gainType: rateBreakdown.gainType,
    holdingDays,
    gainAmount,
    taxableGain,
    taxAmount,
    rateBreakdown,
    netProceeds,
    isLoss,
    lossCarryForwardValue,
  };
}

// ─── TCS Calculator ───────────────────────────────────────────────────────

export interface TCSResult {
  tcsAmount: number;
  tcsRate: number;
  effectiveRate: number;
  breakdown: string;
}

export function calculateTCS(
  remittanceINR: number,
  purpose: LRSPurpose,
  fyTotalSoFar: number
): TCSResult {
  const THRESHOLD = 1_000_000; // ₹10 lakh

  if (purpose === "education_loan") {
    return { tcsAmount: 0, tcsRate: 0, effectiveRate: 0, breakdown: "Education loan from specified institution: 0% TCS (always)" };
  }

  const totalAfter = fyTotalSoFar + remittanceINR;

  // Tour packages: 5% from first rupee, 20% above ₹10L
  if (purpose === "tour_package") {
    if (fyTotalSoFar >= THRESHOLD) {
      const tcs = remittanceINR * 0.20;
      return { tcsAmount: tcs, tcsRate: 0.20, effectiveRate: tcs / remittanceINR, breakdown: "Tour package above ₹10L: 20%" };
    }
    if (totalAfter <= THRESHOLD) {
      const tcs = remittanceINR * 0.05;
      return { tcsAmount: tcs, tcsRate: 0.05, effectiveRate: 0.05, breakdown: "Tour package: 5% from ₹1" };
    }
    const below = THRESHOLD - fyTotalSoFar;
    const above = remittanceINR - below;
    const tcs = below * 0.05 + above * 0.20;
    return { tcsAmount: tcs, tcsRate: 0, effectiveRate: tcs / remittanceINR, breakdown: "Tour package: 5% below ₹10L, 20% above" };
  }

  const rateAbove = purpose === "education_self" || purpose === "medical" ? 0.05 : 0.20;
  const purposeLabel = purpose === "education_self" || purpose === "medical"
    ? "Education/Medical: 5% above ₹10L"
    : "Investment/Gift: 20% above ₹10L";

  if (totalAfter <= THRESHOLD) {
    return { tcsAmount: 0, tcsRate: 0, effectiveRate: 0, breakdown: `${purposeLabel} — under ₹10L threshold` };
  }

  if (fyTotalSoFar >= THRESHOLD) {
    const tcs = remittanceINR * rateAbove;
    return { tcsAmount: tcs, tcsRate: rateAbove, effectiveRate: rateAbove, breakdown: `${purposeLabel}` };
  }

  const taxable = totalAfter - THRESHOLD;
  const tcs = taxable * rateAbove;
  return {
    tcsAmount: tcs,
    tcsRate: rateAbove,
    effectiveRate: tcs / remittanceINR,
    breakdown: `${purposeLabel} on ₹${(taxable / 100_000).toFixed(1)}L above threshold`,
  };
}

// ─── Family TCS optimizer ─────────────────────────────────────────────────

export interface FamilyMemberAllocation {
  memberId: string;
  memberName: string;
  fyRemittedSoFar: number;
  allocation: number;
  tcs: number;
  remainingThreshold: number;
}

export interface FamilyOptimizationResult {
  totalAllocation: number;
  totalTCS: number;
  allocations: FamilyMemberAllocation[];
  tcsWithoutSplitting: number;
  tcsSavings: number;
  recommendation: string;
}

export function optimizeFamilyTCS(
  members: { id: string; name: string; fyRemittedINR: number }[],
  totalRemittanceINR: number,
  purpose: LRSPurpose = "investment"
): FamilyOptimizationResult {
  const THRESHOLD = 1_000_000;

  // Sort by remaining threshold (most remaining first)
  const sorted = [...members].sort(
    (a, b) =>
      Math.max(0, THRESHOLD - b.fyRemittedINR) -
      Math.max(0, THRESHOLD - a.fyRemittedINR)
  );

  let remaining = totalRemittanceINR;
  const allocations: FamilyMemberAllocation[] = [];

  for (const member of sorted) {
    if (remaining <= 0) {
      allocations.push({
        memberId: member.id,
        memberName: member.name,
        fyRemittedSoFar: member.fyRemittedINR,
        allocation: 0,
        tcs: 0,
        remainingThreshold: Math.max(0, THRESHOLD - member.fyRemittedINR),
      });
      continue;
    }

    // Fill this member's threshold first
    const memberRemaining = Math.max(0, THRESHOLD - member.fyRemittedINR);
    const allocation = Math.min(remaining, memberRemaining > 0 ? memberRemaining : remaining);

    const tcsResult = calculateTCS(allocation, purpose, member.fyRemittedINR);
    allocations.push({
      memberId: member.id,
      memberName: member.name,
      fyRemittedSoFar: member.fyRemittedINR,
      allocation,
      tcs: tcsResult.tcsAmount,
      remainingThreshold: memberRemaining,
    });
    remaining -= allocation;
  }

  // If still remaining, distribute among members
  if (remaining > 0) {
    const perMember = remaining / members.length;
    for (const alloc of allocations) {
      if (alloc.allocation === 0 || alloc.fyRemittedSoFar + alloc.allocation >= THRESHOLD) {
        const extra = Math.min(perMember, remaining);
        const extraTCS = calculateTCS(extra, purpose, alloc.fyRemittedSoFar + alloc.allocation);
        alloc.allocation += extra;
        alloc.tcs += extraTCS.tcsAmount;
        remaining -= extra;
      }
    }
  }

  const totalTCS = allocations.reduce((s, a) => s + a.tcs, 0);
  const tcsWithoutSplitting = calculateTCS(totalRemittanceINR, purpose, members[0].fyRemittedINR).tcsAmount;
  const tcsSavings = tcsWithoutSplitting - totalTCS;

  const zeroTCSCapacity = members.reduce(
    (s, m) => s + Math.max(0, THRESHOLD - m.fyRemittedINR),
    0
  );

  const recommendation =
    tcsSavings > 0
      ? `Split remittance across ${members.length} family members to save ₹${(tcsSavings / 100_000).toFixed(1)}L in TCS`
      : `Current split is already optimal. Combined zero-TCS capacity: ₹${(zeroTCSCapacity / 100_000).toFixed(1)}L`;

  return {
    totalAllocation: totalRemittanceINR,
    totalTCS,
    allocations,
    tcsWithoutSplitting,
    tcsSavings,
    recommendation,
  };
}

// ─── TCS IRR drag calculator ──────────────────────────────────────────────

export function calculateTCSIRRDrag(
  tcsAmount: number,
  monthsUntilRefund = 12,
  expectedAnnualReturn = 0.12
) {
  const monthlyReturn = Math.pow(1 + expectedAnnualReturn, 1 / 12) - 1;
  const opportunityCost = tcsAmount * (Math.pow(1 + monthlyReturn, monthsUntilRefund) - 1);
  return {
    tcsAmount,
    monthsLocked: monthsUntilRefund,
    opportunityCost: Math.round(opportunityCost),
    effectiveCostBps: ((opportunityCost / tcsAmount) * 10000).toFixed(1),
  };
}

// ─── Income bracket helper ────────────────────────────────────────────────

export type IncomeBracket =
  | "up_to_50L"
  | "50L_to_1Cr"
  | "1Cr_to_2Cr"
  | "2Cr_to_5Cr"
  | "above_5Cr";

export function getIncomeBracketLabel(bracket: IncomeBracket): string {
  const map: Record<IncomeBracket, string> = {
    up_to_50L: "Up to ₹50L",
    "50L_to_1Cr": "₹50L – ₹1Cr",
    "1Cr_to_2Cr": "₹1Cr – ₹2Cr",
    "2Cr_to_5Cr": "₹2Cr – ₹5Cr",
    above_5Cr: "Above ₹5Cr",
  };
  return map[bracket];
}

export function bracketToIncome(bracket: IncomeBracket): number {
  const map: Record<IncomeBracket, number> = {
    up_to_50L: 4_000_000,
    "50L_to_1Cr": 7_500_000,
    "1Cr_to_2Cr": 15_000_000,
    "2Cr_to_5Cr": 35_000_000,
    above_5Cr: 60_000_000,
  };
  return map[bracket];
}
