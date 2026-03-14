# TLH Platform — User Guide
### How to get the most out of every feature

> **Who this is for:** Indian HNI investors with GIFT City IFSC fund holdings, and MFDs managing such clients.
> **Access the platform at:** `http://localhost:3000`

---

## The One-Line Summary

This platform does one thing that no other Indian tool does: it **finds and quantifies every rupee of tax you can legally save** by timing your transactions correctly — using the 27.79 percentage-point spread between STCG (42.74%) and LTCG (14.95%) rates as its core engine.

---

## Feature 1: Dashboard (`/`)

### What it shows
Your complete portfolio snapshot — all 7 GIFT City IFSC positions, unrealized gains/losses, and the single most important number: **TLH Savings Available** (how much tax you can save today just by executing losses).

### How to read it

**KPI Cards (top row):**
- **Portfolio Value** — total current market value in ₹ and USD
- **Unrealized P&L** — gains and losses separately (not netted)
- **TLH Savings Available** — click this to go directly to the TLH Engine
- **Family TCS Paid** — total TCS already deducted this FY across all family members

**Holdings Table:**
- The **Type** column is the most important: `STCG` = taxed at up to 42.74%, `LTCG` = only 14.95%, `STCL` = a harvestable loss
- The **"Xd to LTCG"** warning in amber tells you positions that are close to crossing the 730-day threshold — don't accidentally sell these and trigger STCG when you're weeks away from LTCG
- Sort mentally by the Type column: `STCL` positions are your harvest candidates

**Tax Rate Reference (bottom banner):**
- Shows your effective rates in real time: 42.74% STCG vs 14.95% LTCG at >₹5Cr income
- The 27.79pp spread is the economic basis for every decision this platform makes

### What to do first
1. Note the **TLH Savings Available** number — this is your potential one-time tax saving
2. Check if any holdings show "Xd to LTCG" — if so, don't sell those until they cross 730 days
3. Click "View All" on the TLH summary card to see ranked opportunities

---

## Feature 2: TLH Engine (`/tlh`) — The Core Feature

### What it does
Scans your portfolio and shows every position where selling at a loss today would save you more in tax than it costs in transaction fees.

### How to read each Opportunity Card

```
┌─────────────────────────────────────────────────────────────┐
│ ● 87          Mirae Asset Global Leaders IFSC    [STCL][High]│
│               Mirae Asset MF · MIRAE-GLOBAL · 2,200 units    │
│                                                               │
│ Unrealized Loss  │ Est. Tax Saving  │ Net Benefit  │ Held    │
│ −₹32.1L         │ ₹13.7L           │ ₹13.7L       │ 9m 13d  │
│                                                               │
│ Book STCL now — offsets existing STCG at 42.74%.            │
│ Rebuy same day is allowed (no wash sale rules in India).     │
│                                                               │
│ [ Harvest ₹32.1L Loss ]          [ ˅ Show Math ]            │
└─────────────────────────────────────────────────────────────┘
```

- **● 87** — Priority score 0-100. Higher = harvest first.
- **STCL badge** — Short-Term Capital Loss. More valuable than LTCL because it offsets both STCG and LTCG.
- **Est. Tax Saving** — what you actually save in tax rupees (loss × effective rate)
- **Net Benefit** — savings minus transaction cost (brokerage + spread ~0.15%)

### Click "Show Math" to see the formula

Every opportunity card has an expandable math panel showing:
```
Unrealized loss = ($71.20 − $88.75) × 2,200 × ₹83.5 = −₹32.2L
This is STCL because 293 days held ≤ 730-day threshold

Tax saving = ₹32.2L × 42.74% (STCG rate) = ₹13.8L
Why 42.74%? 30% slab × 1.37 surcharge × 1.04 cess = 42.74%

Transaction cost (0.15% of position) = −₹39,000
Net benefit = ₹13.8L − ₹39K = ₹13.76L
```

### The "Harvest" Button — What actually happens

When you click **Harvest ₹X Loss**:
1. The card moves to "Executed" state (green)
2. The running savings counter at the top updates
3. In production: this would trigger the actual sell order

**After harvesting, immediately rebuy the same fund.** India has no wash sale rules (unlike the US where you must wait 30 days). Your new cost basis = the repurchase price (lower). You've locked in the tax loss with zero change in portfolio exposure.

### Using "Harvest All"

For your team demo: click **Harvest All** in the top-right. Watch the running savings counter accumulate — this shows the total TLH yield for the year.

### Priority: which order should you harvest?

Always in this order:
1. **STCL positions where you have existing STCG** → saves up to 42.74% — do first
2. **STCL positions for carry-forward** → still STCL, can offset both STCG and LTCG in future years
3. **LTCL positions where you have LTCG** → saves 14.95% — do last

### The FY-End Urgency (March 11 → March 31)

You have **20 days left** in FY 2025-26. Losses must be booked (sold and settled) before March 31. T+2 settlement means the last day to execute is approximately March 28-29. The sidebar counter shows this in real time.

---

## Feature 3: LRS Tracker (`/lrs`)

### What it shows
How much each family member has remitted via LRS this FY, how much TCS has been deducted, and how to optimally distribute a planned remittance to minimize TCS.

### Reading the Circular Gauges

Each gauge shows: `$X used of $250K` (USD LRS limit per person per FY)

- **Green arc** = under 50% of limit used — plenty of room
- **Yellow arc** = 50–80% — moderate
- **Red arc** = over 80% — approaching limit

Below each gauge:
- **TCS Deducted** — how much TCS has already been paid this FY (refundable in ITR)
- **TCS threshold left** — how much more can be remitted at 0% TCS. Once exhausted, every rupee costs 20%.

### The TCS Optimizer — The Slider

This is the most actionable tool in the LRS page:

1. **Drag the slider** to your planned remittance amount (e.g., ₹1 Crore)
2. **Select purpose** (Investment = 20% above threshold)
3. See instantly:
   - **Without family split**: what TCS you'd pay routing everything through one PAN
   - **With optimal split**: how the algorithm distributes across 3 family members to minimize TCS
   - **TCS saved**: the actual rupee saving from splitting

**Example — ₹50L planned remittance:**
```
Without split (Rajesh only, already at ₹92L):
  ₹50L × 20% = ₹10L TCS

With optimal split (3 members):
  Algorithm finds each member's remaining ₹10L bucket
  All three already over threshold, so:
  ₹16.67L each × 20% = ₹3.33L TCS each = ₹10L total
  (same in this case — all buckets exhausted)

Better: use cross-FY strategy
  ₹25L before March 31 + ₹25L after April 1
  New FY = new ₹10L bucket for each member
  First ₹10L of each member next FY = 0% TCS
```

### TCS Opportunity Cost Panel

Shows the **IRR drag** from TCS locked with the government:

```
Formula: TCS × ((1 + monthly_return)^months − 1)
         = ₹31.5L × ((1 + 0.9489%)^12 − 1)
         = ₹31.5L × 12% = ₹3.78L opportunity cost
```

The ₹3.78L is money you're effectively losing each year by paying TCS upfront instead of investing it. **Mitigation**: offset TCS against advance tax installments (due Jun 15, Sep 15, Dec 15, Mar 15).

---

## Feature 4: Capital Gains Calculator (`/calculator`)

### The "Show Math" Toggle

Click **Show Math** in the top-right — this is the key feature that was missing before. It shows:

```
Step 1: Gain in USD = ($245 − $210) × 100 units = $3,500
Step 2: Convert to INR = $3,500 × ₹83.50 = ₹2,92,250
Step 3: Holding Period = 18 months = ~540 days vs 730-day threshold → STCG (190 days short)
Step 4: Base rate = 30% (slab rate, above ₹5Cr income)
Step 5: Surcharge = 37% (NO CAP for STCG)
Step 6: Cess = +4%
Step 7: Effective rate = 30% × (1+37%) × (1+4%) = 42.74%
Step 8: Tax = ₹2,92,250 × 42.74% = ₹1,24,867
```

The right side shows the **LTCG formula simultaneously** for comparison, so you can see both rates and the spread in real time as you adjust.

### Using the Sliders

**Holding Period Slider** — the most powerful slider:
- Drag to watch the classification flip from STCG to LTCG at 730 days
- When you cross 730 days: tax drops from 42.74% to 14.95% — the number jumps visually
- The "Scenario comparison" card appears for STCG positions showing exactly how much you save by waiting

**Practical use:**
1. Enter the actual buy price and current price of a position you're considering selling
2. Enter your actual holding period in months
3. Select your income bracket
4. See: should you sell now (STCG) or wait for LTCG? The calculator shows the exact rupee benefit of waiting.

### The Rate Table at the Bottom

Shows effective rates for ALL income brackets side by side. Use this to:
- See how the LTCG surcharge cap benefits ultra-HNIs most (15% cap vs 37% actual)
- Show clients why they're in a specific bracket's effective rate
- The "Spread" column shows the TLH value-per-rupee at each income level

---

## Feature 5: AI Tax Advisor (`/chat`)

### What it can do

The chatbot uses **GPT-4o + semantic search** over 4 regulatory documents:
- LRS/TCS rules (RBI Master Directions + Budget 2025)
- Capital gains on IFSC funds (IT Act Sections 112, 48)
- TLH rules including India's no-wash-sale confirmation
- GIFT City compliance (Schedule FA, Form 67, Black Money Act)

### How to get the best answers

The AI is now configured to **always show comparison tables and actual math**. The more specific your question, the better the answer. Good examples:

**Best questions to ask:**

| Question | What you'll get |
|----------|----------------|
| "I have ₹28L STCL and ₹15L STCG. What's my net tax?" | Full calculation with offset table |
| "My holding is 22 months old and I'm at ₹3Cr income. Should I sell now or wait?" | Exact rupee comparison: sell now vs wait 60 days |
| "What TCS will I pay on ₹1.2Cr remittance if I've already sent ₹8L this FY?" | Step-by-step TCS calculation |
| "Can I sell Mirae IFSC fund today and rebuy it tomorrow?" | Wash sale rules explanation with statutory basis |
| "My family has 3 adults. How should we split a ₹2Cr planned investment remittance?" | Optimal allocation algorithm output |
| "What exactly do I need to disclose in Schedule FA for my GIFT City holdings?" | Complete compliance checklist |

**How the RAG works (the "RAG" badge):**
When you see `RAG` badge on an answer, it means the AI searched the regulatory documents and found specific text backing its answer. The score shown (e.g., 0.992) is the semantic similarity — higher = more relevant source found.

### Suggested Questions Panel (right side)

Click any of the 8 pre-built questions to get a formatted, well-structured answer without typing. Good for:
- Team demos: click one to show how the AI handles complex tax scenarios
- Quick reference: each question covers a different topic area

### Reading AI Responses

The AI is instructed to always produce:
1. A calculation block showing the actual math
2. A comparison table (before/after, Scenario A vs B)
3. The statutory citation (e.g., "Section 112 proviso")
4. A clear decision recommendation in bold
5. A CA disclaimer at the end

---

## 5-Minute Demo Flow for Your Team

This sequence shows maximum impact in minimum time:

**Minute 1 — Dashboard**
- Open `localhost:3000`
- Point to the ₹22.4L TLH Savings Available card
- Say: "This is tax the client is leaving on the table right now"

**Minute 2 — TLH Engine**
- Go to `/tlh`
- Click the **expand chevron** on the Mirae card to show the math
- Read out: "₹32L loss × 42.74% = ₹13.7L in tax saved, net of costs"
- Click **Harvest** on 2-3 cards, watch the savings counter increment
- Click **Harvest All**, show final total

**Minute 3 — LRS Tracker**
- Go to `/lrs`
- Point to Rajesh's gauge: "₹92L remitted, ₹16.4L TCS paid"
- Drag the optimizer slider to ₹1.5Cr planned remittance
- Show the split recommendation: how distributing across 3 members changes TCS

**Minute 4 — Calculator**
- Go to `/calculator`
- Make sure **Show Math** is toggled on
- Drag Holding Period slider from 18 months to 26 months — show the rate cliff
- Read the formula: "The 15% surcharge cap on LTCG vs uncapped 37% on STCG = the entire economic basis of this platform"

**Minute 5 — AI Chat**
- Go to `/chat`
- Click: *"Should I harvest a STCL now or wait until it becomes LTCL? My holding is 18 months old."*
- Wait for response — show the comparison table the AI generates
- Point to the `RAG` badge: "It's reading actual regulatory documents, not just training data"

---

## Key Numbers to Remember

| Number | What it is | Why it matters |
|--------|-----------|----------------|
| **42.74%** | Max STCG rate (>₹5Cr, old regime) | Every STCL harvested saves up to this much |
| **14.95%** | Max LTCG rate (any income) | 15% surcharge cap makes this the ceiling |
| **27.79pp** | The spread (STCG − LTCG) | The economic engine behind every TLH decision |
| **730 days** | LTCG threshold | The most important number for timing decisions |
| **₹10 lakh** | TCS-free LRS per PAN per FY | Multiply by family members for total 0% TCS capacity |
| **8 years** | Loss carry-forward window | STCL/LTCL can be used for 8 assessment years |
| **July 31** | ITR filing deadline | Miss this = permanently lose carry-forward rights |
| **March 31** | FY end = last TLH window | Losses must settle before this date |
| **0.992** | RAG search score in chat | Near-perfect retrieval of relevant regulatory text |

---

## Common Mistakes This Platform Prevents

| Mistake | How the platform flags it |
|---------|--------------------------|
| Selling a STCG position 3 weeks before LTCG threshold | Holdings table shows "21d to LTCG" in amber |
| Not using family members' LRS buckets | LRS optimizer shows split savings in green |
| Filing ITR late and losing carry-forward | Compliance deadline card shows 20 days countdown |
| Paying TCS on investment remittance that could be 0% | TCS calculator shows ₹0 threshold remaining |
| Waiting for LTCL instead of harvesting STCL now | TLH card shows STCL is 2.78× more valuable |
| Forgetting Schedule FA for GIFT City holdings | Compliance page flags IFSC as "foreign asset" requiring FA |

---

*For specific tax advice, consult a qualified Chartered Accountant. This platform is for informational and analytical purposes only.*
