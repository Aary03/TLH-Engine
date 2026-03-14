# TLH Platform — Formula Methodology & Core Intelligence

> Complete documentation of every calculation engine, formula, and decision algorithm used in the platform.
> All formulas are encoded in `lib/tax-calculations.ts`, `lib/tlh-engine.ts`, and `lib/mock-data.ts`.

---

## Table of Contents

1. [Capital Gains Tax Engine](#1-capital-gains-tax-engine)
2. [Surcharge & Cess Framework](#2-surcharge--cess-framework)
3. [TCS Calculator](#3-tcs-calculator)
4. [TLH Priority Algorithm](#4-tlh-priority-algorithm)
5. [Family TCS Optimizer](#5-family-tcs-optimizer)
6. [TCS Opportunity Cost (IRR Drag)](#6-tcs-opportunity-cost-irr-drag)
7. [Holding Period Decision Engine](#7-holding-period-decision-engine)
8. [Loss Carry-Forward Value Model](#8-loss-carry-forward-value-model)
9. [Why India's No-Wash-Sale Rule Changes Everything](#9-why-indias-no-wash-sale-rule-changes-everything)
10. [The Rate Spread — The Core Asymmetry](#10-the-rate-spread--the-core-asymmetry)

---

## 1. Capital Gains Tax Engine

### Classification

GIFT City IFSC funds are **non-equity/overseas funds** — they fail the 65% domestic equity threshold. This classification drives everything downstream.

```
If fund's domestic equity allocation ≥ 65%  →  Equity fund  →  Section 111A rates
If fund's domestic equity allocation < 65%   →  Non-equity   →  Section 112 rates
```

GIFT City IFSC funds (PPFAS IFSC, Tata S&P 500 IFSC, Mirae Global IFSC, etc.) always fall into the non-equity bucket because they invest in Ireland-domiciled UCITS ETFs tracking global indices.

### Holding Period Classification

```
Holding days = Sale date − Purchase date  (in calendar days)

If holding_days > 730  →  LTCG (Long-Term Capital Gain)
If holding_days ≤ 730  →  STCG (Short-Term Capital Gain)
```

**730 days = exactly 24 months.** Not "after 2 years" loosely — the exact day count matters. A leap year in the holding period changes the LTCG crossover date.

### Gain Calculation

```
Gain (USD)  = (Sell Price − Buy Price) × Quantity
Gain (INR)  = Gain (USD) × Exchange Rate (SBI TTBR)

Exchange rate used: RBI Reference Rate on date of transaction
For ITR purposes: SBI TT Buying Rate on last day of preceding month
```

### Tax Amount

```
Tax Amount = max(0, Gain_INR) × Effective Rate
Net Proceeds = (Sell Price × Quantity × Exchange Rate) − Tax Amount
```

---

## 2. Surcharge & Cess Framework

### Surcharge Rates by Income (Old Regime)

| Total Income        | Surcharge Rate |
|---------------------|---------------|
| Up to ₹50 lakh      | 0%            |
| ₹50L – ₹1 Crore     | 10%           |
| ₹1Cr – ₹2 Crore     | 15%           |
| ₹2Cr – ₹5 Crore     | 25%           |
| Above ₹5 Crore      | **37%**       |

### Surcharge Rates by Income (New Regime)

| Total Income        | Surcharge Rate |
|---------------------|---------------|
| Up to ₹50 lakh      | 0%            |
| ₹50L – ₹1 Crore     | 10%           |
| ₹1Cr – ₹2 Crore     | 15%           |
| ₹2Cr – ₹5 Crore     | 25%           |
| Above ₹5 Crore      | **25%** (capped vs old regime) |

### The 15% Surcharge Cap on LTCG — The Critical Asymmetry

This is the single most important rule in the platform. Under **Section 112** of the IT Act:

> The surcharge on LTCG from non-equity funds is **capped at 15%**, regardless of how high total income is.

```
LTCG Surcharge = min(actual_surcharge_rate, 15%)
```

For someone with income above ₹5 Crore (old regime), their actual surcharge is 37%. But on LTCG, it's capped at 15%. There is **no such cap for STCG** — STCG at slab rate carries the full 37% surcharge.

### Effective Rate Formulas

**LTCG (Section 112 — overseas/IFSC funds):**
```
Effective_LTCG = 12.5% × (1 + min(surcharge, 15%)) × (1 + 4%)
               = 12.5% × (1 + min(surcharge, 0.15)) × 1.04

Maximum (any income level):
= 12.5% × 1.15 × 1.04
= 14.95%
```

**STCG (at slab rate — no surcharge cap):**
```
Effective_STCG = Slab_Rate × (1 + surcharge) × (1 + 4%)
               = Slab_Rate × (1 + surcharge) × 1.04

Maximum (above ₹5Cr, old regime):
= 30% × 1.37 × 1.04
= 42.744%
```

### Complete Effective Rate Table

| Income Level     | STCG Rate | LTCG Rate | Spread (pp) | Tax saved per ₹1L STCL vs STCG |
|-----------------|-----------|-----------|-------------|--------------------------------|
| Up to ₹50L      | 31.20%    | 13.00%    | 18.20       | ₹31,200                       |
| ₹50L – ₹1Cr     | 34.32%    | 14.30%    | 20.02       | ₹34,320                       |
| ₹1Cr – ₹2Cr     | 35.88%    | 14.95%    | 20.93       | ₹35,880                       |
| ₹2Cr – ₹5Cr     | 39.00%    | 14.95%    | 24.05       | ₹39,000                       |
| Above ₹5Cr      | **42.74%**| **14.95%**| **27.79**   | **₹42,744**                   |

> **The spread of 27.79 percentage points** is why every algorithmic decision in this platform defaults to: avoid STCG, harvest STCL aggressively.

---

## 3. TCS Calculator

### Threshold Logic

```python
THRESHOLD = ₹10,00,000  # ₹10 lakh per PAN per FY (Budget 2025)

def calculate_TCS(remittance, purpose, fy_cumulative):

    total_after_remittance = fy_cumulative + remittance

    # Education loan from specified institution: always 0%
    if purpose == "education_loan":
        return 0

    # Tour packages: special rate from rupee one
    if purpose == "tour_package":
        if total_after_remittance <= THRESHOLD:
            return remittance × 5%
        elif fy_cumulative >= THRESHOLD:
            return remittance × 20%
        else:
            below = THRESHOLD − fy_cumulative
            above = remittance − below
            return (below × 5%) + (above × 20%)

    # Education (self) / Medical: 5% above threshold
    if purpose in ["education_self", "medical"]:
        rate_above = 5%

    # Investment / Gift / Maintenance / GIFT City remittance: 20% above threshold
    else:
        rate_above = 20%

    if total_after_remittance <= THRESHOLD:
        return 0
    elif fy_cumulative >= THRESHOLD:
        return remittance × rate_above
    else:
        taxable = total_after_remittance − THRESHOLD
        return taxable × rate_above
```

### Key Rule: GIFT City = Investment Purpose

GIFT City IFSC fund remittances fall under "any other purpose" (investment/gifts) — **0% up to ₹10L, 20% above ₹10L**. This was explicitly confirmed when Parliament amended Section 206C(1G)(a) to remove "out of India" — deliberately including GIFT City in the TCS net.

### Air Tickets vs Tour Packages

A meaningful optimization encoded in the platform:

```
Air ticket booked directly through bank's LRS facility = "any other purpose"
→ 0% TCS up to ₹10L

Same trip booked as a "tour package" = "tour package"
→ 5% TCS from rupee one

Savings on ₹5L trip booked directly: ₹25,000 (5% × ₹5L)
```

---

## 4. TLH Priority Algorithm

### The Core Insight: STCL Has Broader Offset Capability

```
STCL can offset:  STCG (at up to 42.74%)  AND  LTCG (at up to 14.95%)
LTCL can offset:  LTCG ONLY               (at up to 14.95%)
```

This makes STCL up to **3× more valuable** than LTCL per rupee of loss.

### Priority Ranking

```
Priority 1 (Highest):  STCL  +  Existing STCG in current FY
  → Saves: loss_amount × 42.74%  (up to ₹42,744 per ₹1L)

Priority 2:            STCL  +  Existing LTCG in current FY
  → Saves: loss_amount × 14.95%  (up to ₹14,950 per ₹1L)

Priority 3:            LTCL  +  Existing LTCG in current FY
  → Saves: loss_amount × 14.95%  (up to ₹14,950 per ₹1L)

Priority 4:            STCL carry-forward for future use
  → Future savings at whichever rate applies to future gains

Priority 5 (Lowest):   LTCL carry-forward for future use
  → Can only offset future LTCG — limited utility
```

### Savings Calculation

```
# If existing STCG is available to offset:
savings = min(loss, existing_STCG) × stcg_rate
        + max(0, loss − existing_STCG) × ltcg_rate

# If no existing STCG:
savings = loss × stcg_rate  [for STCL — retains broad future offset]
savings = loss × ltcg_rate  [for LTCL — limited future offset]
```

### Net Benefit Filter

```
transaction_cost = position_value × 0.15%
                 = (current_NAV × quantity × exchange_rate) × 0.0015
                   [covers brokerage + bid-ask spread]

net_benefit = best_case_savings − transaction_cost

# Only flag as opportunity if net_benefit > 0
# Suggested minimum threshold: ₹10,000–₹50,000 net benefit
```

### Priority Score (0–100)

```
score = 0
score += min(40, (net_benefit / ₹10L) × 40)    # Net benefit component
score += 30  if is_STCL                          # Broader offset bonus
score += 20  if existing_STCG > 0               # Immediate offset available
score += 10  if days_until_FY_end ≤ 30           # FY-end urgency

score = min(100, round(score))
```

### Urgency Classification

```
CRITICAL  →  days_to_FY_end ≤ 20  AND  is_STCL
HIGH      →  net_benefit > ₹5L
MEDIUM    →  net_benefit > ₹2L
LOW       →  everything else
```

---

## 5. Family TCS Optimizer

### The Fundamental Principle

Each resident individual has their **own independent ₹10 lakh TCS-free bucket**. A family of N adults = N × ₹10L = N × ₹0 TCS capacity.

```
Family TCS-free capacity = Σ max(0, ₹10L − member.fy_cumulative_remitted)
                           for each adult family member
```

### Optimal Allocation Algorithm

```python
def optimize_family_TCS(members, total_remittance, purpose):

    # Sort members by most remaining threshold (greedy fill)
    members.sort(by=remaining_threshold, descending=True)

    remaining = total_remittance
    allocations = []

    for member in members:
        remaining_threshold = max(0, ₹10L − member.fy_remitted)

        # Fill up to threshold first (0% TCS zone)
        allocation = min(remaining, remaining_threshold)
        tcs = 0  # Under threshold = ₹0 TCS

        if remaining > remaining_threshold:
            # Distribute excess evenly across all members
            excess_per_member = (remaining − remaining_threshold) / N
            allocation += excess_per_member
            tcs = excess_per_member × rate_above

        allocations.append({member, allocation, tcs})
        remaining -= allocation

    return allocations
```

### Savings Calculation

```
tcs_single_PAN = TCS(total_remittance, purpose, member[0].fy_cumulative)
tcs_optimized  = Σ TCS(allocation[i], purpose, member[i].fy_cumulative)

savings = tcs_single_PAN − tcs_optimized
```

### Example: ₹1.5 Crore remittance, 3 family members

```
Without splitting (all through Rajesh, who has ₹92L already remitted):
  TCS = ₹1.5Cr × 20% = ₹30L  (already over threshold)

With optimal split across 3 members:
  Rajesh: remaining threshold = ₹0 (already at ₹92L)
    → ₹50L × 20% = ₹10L TCS
  Priya: remaining threshold = ₹0 (already at ₹85L)
    → ₹50L × 20% = ₹10L TCS
  Vikram: remaining threshold = ₹10L − ₹28L = ₹0 (already over)
    → ₹50L × 20% = ₹10L TCS

  Total with split: ₹30L TCS (same in this case — all members exhausted)

Better scenario — plan AHEAD of FY (all at ₹0 remitted):
  Each member: ₹10L at 0% + ₹40L at 20%
  Each: ₹8L TCS × 3 = ₹24L total
  vs without split: ₹28L TCS on ₹1.5Cr single PAN
  Savings: ₹4L
```

---

## 6. TCS Opportunity Cost (IRR Drag)

### The Problem

TCS is deducted at source by the bank and deposited with the government. The investor only gets it back after filing ITR — typically 7–45 days post e-verification. For large remittances, this means **lakhs of rupees locked for 6–15 months** earning nothing.

### Formula

```
monthly_return = (1 + annual_return)^(1/12) − 1

opportunity_cost = TCS_amount × ((1 + monthly_return)^months_until_refund − 1)
```

With `annual_return = 12%` and `months_until_refund = 12`:

```
monthly_return = (1.12)^(1/12) − 1 = 0.9489%

opportunity_cost = TCS × ((1.009489)^12 − 1)
                 = TCS × (1.12 − 1)
                 = TCS × 12%

For TCS of ₹31.5L (Rajesh + Priya + Vikram combined):
  opportunity_cost = ₹31.5L × 12% = ₹3.78L lost
```

### Effective Basis Points (bps) of Drag

```
drag_bps = (opportunity_cost / TCS_amount) × 10,000
         = 12% × 10,000 / 1
         = 1200 bps  (if refund takes exactly 12 months)
```

### Mitigation Strategy

Offset TCS against advance tax installments to reduce the locked-capital period:

```
Advance tax dates: Jun 15 (15%), Sep 15 (45%), Dec 15 (75%), Mar 15 (100%)

Instead of:  TCS locked → ITR → Refund  (12+ months)
Use:         TCS credit applied against advance tax installment (3–9 months)
```

---

## 7. Holding Period Decision Engine

### The Central Question

> Should I harvest a STCL now, or wait for it to become a LTCL?

Answer: **Almost always harvest STCL now.** Here's the math:

```
stcl_value = loss × stcg_rate    [STCL — offsets STCG at 42.74% OR LTCG at 14.95%]
ltcl_value = loss × ltcg_rate    [LTCL — can ONLY offset LTCG at 14.95%]

advantage_of_harvesting_now = stcl_value − ltcl_value
                             = loss × (stcg_rate − ltcg_rate)
                             = loss × (42.74% − 14.95%)
                             = loss × 27.79%

For ₹10L loss above ₹5Cr income:
  harvest_now_value  = ₹4,27,440
  wait_for_ltcl      = ₹1,49,500
  advantage          = ₹2,77,940  (2.78× more valuable to harvest now)
```

### When Waiting IS Better

The only case where waiting makes sense:

```
IF:  you have NO existing STCG (now or expected this FY)
AND: you have large LTCG you want to offset
AND: the security is approaching the 730-day threshold soon

THEN: Compare the incremental offset value vs time value of money delay
```

```
days_to_ltcg = max(0, 730 − holding_days)
days_until_fy_end = days until March 31

if days_to_ltcg > days_until_fy_end:
    # Can't reach LTCG this FY anyway — harvest STCL now
    recommendation = "HARVEST_NOW"

if days_to_ltcg <= 30:
    # Almost there — consider waiting if no STCG exists
    recommendation = "EVALUATE" 
```

### Approaching LTCG Threshold Alert

```
# Flag positions where days_to_ltcg is 30–90 days
# These need active monitoring — don't accidentally trigger STCG on a profitable position

warning_zone = 30 days  →  "Sell now = STCG at 42.74% — consider waiting"
critical_zone = 730 days  →  "Now LTCG eligible — new sell = 14.95%"
```

---

## 8. Loss Carry-Forward Value Model

### Rules from Section 74 of the IT Act

```
STCL carry-forward:
  - Duration: 8 assessment years from year of loss
  - Can offset: STCG and LTCG in future years
  - Condition: ITR filed on or before July 31 (due date)

LTCL carry-forward:
  - Duration: 8 assessment years from year of loss
  - Can offset: LTCG ONLY in future years
  - Condition: ITR filed on or before July 31 (due date)
```

### Present Value of Carry-Forward Loss

```
# A loss carried forward is worth less than a loss used immediately
# because of the time value of money

PV_factor = 1 / (1 + discount_rate)^years_until_offset

# If you'll use the loss 2 years from now at 12% discount rate:
PV_factor = 1 / 1.12^2 = 0.797

# ₹1L STCL available today:
  Use now:      ₹42,744 tax saved today
  Use in 2 yrs: ₹42,744 × 0.797 = ₹34,067 in present value

# Takeaway: always use carry-forwards as early as possible
```

### The July 31 Filing Cliff

```
ITR filed by July 31  →  carry-forward PRESERVED for 8 years
ITR filed after July 31 (belated)  →  carry-forward PERMANENTLY LOST

This is irreversible. A belated ITR revised return does NOT restore it.

For a portfolio with ₹50L in harvested losses:
  Loss if filing is belated:
  STCL × 42.74% = ₹50L × 42.74% = ₹21.37L in foregone future tax savings
```

---

## 9. Why India's No-Wash-Sale Rule Changes Everything

### The US Problem (Section 1091, IRC)

In the United States:
- Sell security at a loss
- Buy "substantially identical" security within 30 days before or after
- Result: **Loss is disallowed** — added to cost basis of new position
- 61-day window (30 days before + day of sale + 30 days after)

This means US investors must either:
1. Wait 30+ days to rebuy (missing potential recovery)
2. Buy a *different but similar* security (S&P 500 ETF → swap to total market ETF)
3. Forgo harvesting entirely if they don't want to change exposure

### India's Advantage

```
India has NO Section 1091 equivalent.
India has NO "substantially identical" concept.
India has NO 30-day or 61-day disallowance window.

Action:
  Day 1, 10:00 AM:  Sell 1,000 units of TATA-SP500-IFSC at ₹196.50 (at a loss)
  Day 1, 10:01 AM:  Buy 1,000 units of TATA-SP500-IFSC at ₹196.50
  Day 1, 10:01 AM:  Loss FULLY recognized. New cost basis = ₹196.50.

This is completely legal.
```

### Section 94(8) — The ONLY Wash-Sale-Like Rule

India's closest equivalent applies **only** to MF bonus stripping:

```
Section 94(8) disallows loss IF:
  1. Units acquired ≤ 3 months before bonus record date
  2. Bonus units received on record date
  3. Original units sold at a loss within 9 months after record date

Effect: Loss on original units ignored; deemed to be cost of bonus units.

This is NARROW and SPECIFIC. It does NOT apply to:
  - Normal sell-and-rebuy TLH
  - Any non-bonus scenario
  - Any scenario without bonus units being received
```

### Quantified Advantage

For a ₹5 Crore IFSC portfolio with 15% annual volatility:

```
US investor (with wash sale rules):
  Must use different-but-similar ETF for 30 days
  Risk of tracking error during 30-day period
  Practical limit: ~30–35% of losses can be harvested annually

Indian investor (no wash sale rules):
  Immediate rebuy of identical security
  Zero tracking error risk
  Zero market timing risk during waiting period
  Practical limit: up to ~45–50% of losses harvestable annually
```

---

## 10. The Rate Spread — The Core Asymmetry

### The Single Most Important Number in This Platform

For an investor with income above ₹5 Crore (old regime):

```
STCG Rate:  42.744%  (30% base × 1.37 surcharge × 1.04 cess)
LTCG Rate:  14.950%  (12.5% base × 1.15 surcharge cap × 1.04 cess)
Spread:     27.794 percentage points
```

This spread is not a rounding artifact. It is **structural** and **permanent** for as long as:
1. Section 112 surcharge cap at 15% remains law
2. STCG is taxed at slab rate without surcharge cap
3. The 30% top marginal slab rate remains

### What It Means in Practice

```
Per ₹1 Crore of capital gains:

If STCG:  ₹42,74,400 in tax
If LTCG:  ₹14,95,000 in tax
Saved by waiting 730 days:  ₹27,79,400 per ₹1 Crore

Per ₹1 Crore of capital LOSSES (STCL harvested):
  If offset against STCG:  ₹42,74,400 in tax saved
  If offset against LTCG:  ₹14,95,000 in tax saved
  Premium for broad STCL offset:  ₹27,79,400 per ₹1 Crore
```

### The Three-Way Decision Matrix

```
For any position with unrealized loss:

SCENARIO A — You have STCG this FY:
  → Harvest STCL immediately
  → Offset at 42.74%
  → Net saving: loss × 42.74%
  → Decision: ALWAYS HARVEST NOW

SCENARIO B — No STCG, but expect LTCG this FY or future:
  → Harvest STCL for LTCG offset or carry-forward
  → Net saving: loss × 14.95%
  → Decision: HARVEST NOW (STCL still better than LTCL for carry-forward)

SCENARIO C — Position near 730-day threshold (LTCL approaching):
  → Compare: harvest STCL now vs wait for LTCL
  → Since STCL and LTCL both offset LTCG at 14.95%, and STCL additionally offsets STCG:
  → Decision: HARVEST STCL NOW (STCL weakly dominates LTCL in all scenarios)

EXCEPTION: If security is within 30 days of 730-day threshold AND no STCG exists AND
           the loss is small relative to expected future LTCG offset → evaluate waiting.
```

---

## Regulatory Anchors

All formulas are grounded in these statutory provisions:

| Formula | Statutory Basis |
|---------|----------------|
| LTCG rate 12.5% | Section 112, IT Act (post Budget 2024) |
| LTCG surcharge cap 15% | Proviso to Section 112 |
| STCG at slab rate | Section 48 read with applicable slab rates |
| No surcharge cap on STCG | Absence of proviso equivalent to Section 112 |
| 4% cess | Finance Act (Health and Education Cess) |
| 24-month LTCG threshold | Section 2(42A) definition of "short-term capital asset" |
| TCS threshold ₹10L | Section 206C(1G), Budget 2025 amendment |
| GIFT City as foreign under FEMA | FEMA 1999, IFSCA Act 2019 |
| No wash sale rule | Absence of Section 1091 equivalent in IT Act |
| Section 94(8) bonus stripping | Section 94(8), IT Act |
| 8-year loss carry-forward | Section 74, IT Act |
| ITR deadline for carry-forward | Section 80 read with Section 139(1) |
| Form 67 deadline | CBDT Notification No. 100/2022 |
| Schedule FA penalty ₹10L/yr | Black Money Act 2015, Section 42 |

---

## Disclaimer

This document describes the mathematical and algorithmic logic used in the TLH Platform for informational and illustrative purposes. Tax laws are subject to change. Individual circumstances vary. **Consult a qualified Chartered Accountant or tax professional before making any investment or tax decisions.**
