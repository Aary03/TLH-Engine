export interface BlogSection {
  heading?: string;
  body: string;
  type?: "text" | "tip" | "warning" | "callout";
  calloutTitle?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  readTime: number;
  author: string;
  accentColor: string;
  excerpt: string;
  relatedCalc?: { label: string; href: string };
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  /* ─────────────────────────────────────────────────
     POST 1
  ───────────────────────────────────────────────── */
  {
    slug: "what-is-gift-city-ifsc",
    title: "What is GIFT City IFSC? A complete guide for Indian investors",
    subtitle: "India's first and only International Financial Services Centre — and why it changes everything for HNIs investing globally",
    category: "Fundamentals",
    date: "March 2025",
    readTime: 7,
    author: "Valura Research",
    accentColor: "#05A049",
    excerpt: "GIFT City IFSC is India's answer to Singapore, Mauritius, and the Cayman Islands — a domestic jurisdiction with offshore tax treatment. Here's everything you need to know.",
    relatedCalc: { label: "Net Returns Calculator", href: "/calculators/net-returns" },
    sections: [
      {
        heading: "The problem GIFT City was built to solve",
        body: "Indian HNIs have historically faced a frustrating choice when investing globally: use overseas brokerage accounts (IBKR, Vested, Schwab) and navigate the full weight of Indian taxes on foreign income — TCS, FEMA restrictions, Schedule FA disclosures, US estate tax exposure — or hold everything in India and miss the diversification benefits of global markets. GIFT City IFSC was created to offer a third path: invest globally from within India, with a regulatory and tax framework designed to compete with Singapore and Mauritius.",
      },
      {
        heading: "What exactly is GIFT City?",
        body: "Gujarat International Finance Tec-City (GIFT City) is a purpose-built financial hub located in Gandhinagar, Gujarat. It contains India's first and only International Financial Services Centre (IFSC), regulated by the International Financial Services Centres Authority (IFSCA). For regulatory purposes, transactions within the IFSC are treated as if they occur outside India's domestic territory — similar to the SEZ (Special Economic Zone) framework, but purpose-built for financial services. This means an IFSC-registered fund can hold US stocks, Irish ETFs, and global bonds without the same regulatory and tax treatment that would apply to a domestic Indian fund.",
      },
      {
        heading: "The key tax exemptions that matter for investors",
        body: "Three tax provisions make GIFT City IFSC genuinely powerful for Indian investors. First, Section 10(23FBC) of the Income Tax Act exempts non-resident investors in Category III AIFs registered with IFSCA from Indian tax on any income or capital gains. This is a blanket exemption — gains on US stocks, Irish ETFs, and GIFT City bonds are all covered. Second, Section 10(15)(ix) exempts interest paid to non-residents on IFSC securities from Indian tax. If you hold an IFSC bond and you are a non-resident, India takes nothing. Third, and perhaps most importantly, IFSC fund units are classified as Indian assets under IRS regulations — which means they fall entirely outside the US estate tax framework. The NRA (Non-Resident Alien) estate tax that applies to US stocks held directly does not apply to IFSC fund units.",
        type: "text",
      },
      {
        type: "callout",
        calloutTitle: "What this means in practice",
        body: "A Resident Indian investing via GIFT City does not get all of these exemptions — Sections 10(23FBC) and 10(15)(ix) apply to non-residents. However, Resident Indians still benefit from LTCG at 12.5% (14.95% effective, with the surcharge capped at 15% regardless of income), zero US estate tax, and access to Ireland UCITS ETFs for lower dividend WHT.",
      },
      {
        heading: "Who regulates GIFT City?",
        body: "The IFSCA (International Financial Services Centres Authority) was established in 2020 as the unified regulator for all financial services within GIFT City IFSC. It functions similarly to SEBI, RBI, IRDAI, and PFRDA combined, but specifically for the IFSC jurisdiction. Funds registered as Category III AIFs under IFSCA can invest globally, accept foreign investors, and operate under a lighter regulatory framework than domestic Indian funds. All major custodians (HDFC Bank Custodial, DBS, etc.) have operations in GIFT City, and India's major law firms maintain dedicated IFSC practices.",
      },
      {
        heading: "How Valura uses GIFT City for your investments",
        body: "Valura operates a GIFT City IFSC structure that lets Indian investors access global markets — primarily US equities via Ireland UCITS ETFs and direct US stocks via the Valura-ViewTrade GAP arrangement — without the tax drags that apply to direct overseas investment. Your account is an IFSC account. The fund units you hold are Indian assets (IFSC-classified). Your dividends are routed through Ireland for lower WHT. Your estate is fully outside IRS jurisdiction. And if you are an NRI, your gains are exempt from Indian tax under Section 10(23FBC).",
      },
      {
        type: "tip",
        body: "Use the Net Returns calculator to model your exact after-tax wealth at year 20 comparing a direct IBKR account vs a Valura GIFT City account. For most HNIs remitting above ₹30L, the Route B advantage appears in the first year.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────
     POST 2
  ───────────────────────────────────────────────── */
  {
    slug: "us-estate-tax-trap",
    title: "The US estate tax trap every Indian investor is walking into",
    subtitle: "When you buy Apple or the S&P 500 directly, the IRS has a $0 gift waiting for your family. Here is the math.",
    category: "Estate Planning",
    date: "February 2025",
    readTime: 8,
    author: "Valura Research",
    accentColor: "#DC2626",
    excerpt: "Every Indian holding US stocks directly is classified as a Non-Resident Alien by the IRS. On death, their estate tax exemption is $60,000 — not $13.6 million. Rates go up to 40%.",
    relatedCalc: { label: "Estate Tax Calculator", href: "/calculators/estate-tax" },
    sections: [
      {
        heading: "The $60,000 exemption nobody tells you about",
        body: "When a US citizen or permanent resident dies, their estate is exempt from federal estate tax up to $13.61 million (2024 threshold). For the vast majority of Americans, no estate tax applies. For a Non-Resident Alien — which includes every Indian investor holding US stocks through a direct brokerage account — the exemption is $60,000. The rest is taxed at rates starting at 18% and rising to 40% on estates above $1M above the exemption. This is not a technicality or an edge case. It is black-letter IRS law under IRC Section 2101 and has been confirmed in multiple Revenue Rulings.",
      },
      {
        heading: "The math on a $500,000 US equity portfolio",
        body: "Consider an Indian investor holding $500,000 in US stocks — Apple, Microsoft, an S&P 500 ETF — directly through IBKR or Vested. On death, the IRS classifies these as US-situs assets. The first $60,000 is exempt. The remaining $440,000 is taxed progressively: 18% on the first $10,000, rising through the brackets to 34% on the $190,000 above $250,000. Total federal estate tax: approximately $136,400. At ₹84.50/$, that is ₹1.15 crore — paid to the US government before your family inherits a single rupee. And this is before any state-level estate taxes, probate costs, or international asset recovery fees.",
      },
      {
        heading: "Why this applies to ETFs and mutual funds too",
        body: "Many investors assume that holding an S&P 500 ETF (like SPY, IVV, or VOO) rather than individual stocks protects them from US estate tax. It does not. These are US-domiciled ETFs traded on US exchanges. They hold US stocks. For NRA purposes, units of a US-domiciled ETF are treated as US-situs assets in the same way as the underlying stocks. The IRS 'look-through' rules apply. You are not protected by holding a fund. The only effective solution is to hold a non-US-domiciled vehicle — specifically an Irish UCITS ETF or an IFSCA-registered fund.",
      },
      {
        type: "warning",
        body: "Holding shares in US companies through a Singapore or UAE account does NOT protect you from US estate tax. The estate tax applies to the underlying US-situs asset regardless of the country where the brokerage account is held. The key question is the domicile of the asset, not the account.",
      },
      {
        heading: "How GIFT City IFSC eliminates this risk completely",
        body: "When you invest via a Valura GIFT City IFSC structure, you hold units of an IFSC-registered fund — not US stocks directly. IRS Revenue Ruling 55-143 establishes that intangible personal property owned by an NRA is not US-situs property unless it is issued by a US corporation or evidences a right in a US entity. IFSC fund units are issued by an Indian entity (IFSCA-registered). They are classified as Indian intangible assets. The IRS has no jurisdiction over Indian assets. Result: $0 US estate tax, regardless of the value of your portfolio.",
      },
      {
        heading: "The compounding estate tax risk as portfolios grow",
        body: "At $250,000, the estate tax exposure is approximately $64,000. At $500,000, it is $136,000. At $1,000,000, it exceeds $300,000. At 10% CAGR, a $500,000 portfolio becomes $3.36 million in 20 years — and the estate tax at that point would be approximately $1.3 million. The risk does not stay constant — it compounds in line with your portfolio. The Estate Tax calculator models this growth curve and shows exactly how the gap widens over 20 years.",
      },
      {
        type: "tip",
        body: "India has no estate or inheritance tax. The entire risk described here comes from the US side only. If you hold only Indian assets, UK assets, or Irish ETF assets, there is no equivalent estate tax exposure. The specific problem is US-situs assets.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────
     POST 3
  ───────────────────────────────────────────────── */
  {
    slug: "family-lrs-optimization",
    title: "How to slash your TCS bill using family LRS optimization",
    subtitle: "Every adult in your family has their own ₹10L TCS-free threshold and their own $250,000 LRS annual limit. Most HNIs use only one.",
    category: "TCS Strategy",
    date: "January 2025",
    readTime: 6,
    author: "Valura Research",
    accentColor: "#05A049",
    excerpt: "The 20% TCS on overseas remittances is the single biggest avoidable cost in Indian global investing. Here is the full playbook for minimizing it.",
    relatedCalc: { label: "LRS & TCS Calculator", href: "/calculators/lrs-tcs" },
    sections: [
      {
        heading: "What is TCS and why it hurts so much",
        body: "Under the Liberalised Remittance Scheme (LRS), every Indian resident can remit up to $250,000 per financial year for investment purposes. As of April 1, 2025 (Finance Act 2025), any remittance above ₹10 lakh per PAN per financial year for investment purposes attracts 20% Tax Collected at Source (TCS). The bank deducts this upfront — before your money reaches your GIFT City account. You do get it back via your ITR, but the refund takes 9–18 months depending on when you remit and how quickly the income tax department processes your return. For a ₹50 lakh remittance, the TCS is ₹8 lakh. That is ₹8 lakh not working for you, not compounding, not generating returns — locked in a government account for over a year.",
      },
      {
        heading: "The family threshold rule that changes everything",
        body: "The ₹10L TCS-free threshold applies per PAN, per financial year — not per family. Your spouse has their own ₹10L threshold. Your adult children have their own ₹10L threshold. Each adult family member also has their own $250,000 annual LRS limit. A family of four adults (you, spouse, two adult children) has a combined ₹40L TCS-free threshold and a combined $1,000,000 annual LRS capacity. By routing remittances through each family member's PAN to fill each ₹10L bucket before triggering TCS, you can remit ₹40L completely TCS-free — saving ₹6 lakh in TCS on that amount alone.",
      },
      {
        heading: "The advance tax offset: from 18 months to 3 months",
        body: "Even when TCS is unavoidable (remittance exceeds the family threshold), there is a powerful optimization most HNIs miss. TCS deducted by your bank appears in Form 26AS under Part F. This TCS amount can be directly credited against your advance tax liability — you simply reduce your advance tax payment by the TCS amount. No separate application. No Form 35. No CA letter required. The four advance tax due dates are June 15 (15%), September 15 (45%), December 15 (75%), and March 15 (100%). If you remit in April and pay advance tax quarterly, your TCS is absorbed in 2.5 months — not 18 months. The LRS & TCS calculator models this exactly.",
      },
      {
        type: "callout",
        calloutTitle: "Worked example",
        body: "Arvind remits ₹75L in June (investment, ₹0 already remitted). TCS deducted by bank: ₹13L (20% on ₹65L above threshold). Path 1 — ITR refund: TCS locked for ~15 months. Opportunity cost at 12% return: ₹1.95L. Path 2 — Advance tax offset: Arvind reduces his September 15 advance tax payment by ₹13L. TCS absorbed in 3 months. Opportunity cost: ₹0.39L. By switching to the advance tax path, Arvind saves ₹1.56L in opportunity cost on a single remittance — just by changing when he credits the TCS.",
      },
      {
        heading: "Planning your FY remittance calendar",
        body: "The optimal window for TCS management depends on whether you pay advance tax. If you do: remitting in February or March is optimal — the TCS is absorbed in the very next advance tax installment (March 15), sometimes within weeks. If you do not pay advance tax: remitting as early as possible in the financial year (April or May) minimizes the lock-up period before the next ITR processing cycle. The second worst time to remit (from a TCS lock-up perspective) is October to December — TCS paid then may not be refunded until September of the following year, a 10–11 month wait.",
      },
      {
        heading: "Tracking remittances across family members",
        body: "The most common planning error is losing track of cumulative FY remittances across the family. TCS triggers on the cumulative total from a single PAN in the financial year — not on individual transactions. If Priya remits ₹8L in April and ₹5L in October, the second remittance partially crosses the ₹10L threshold mid-transaction: ₹2L is TCS-free and ₹3L attracts 20% TCS. The Valura LRS & TCS calculator tracks each family member's cumulative remittance and shows the exact split in real time. In the future, this will connect directly to your account data.",
      },
      {
        type: "tip",
        body: "The $250,000 per-person LRS limit and the ₹10L per-person TCS threshold are the same rule applied at different levels. Use both to your advantage. For a family investing ₹1 Cr+, the threshold optimization alone can save ₹10–20L in TCS per financial year.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────
     POST 4
  ───────────────────────────────────────────────── */
  {
    slug: "rnor-golden-window",
    title: "The RNOR golden window: why returning NRIs should invest aggressively now",
    subtitle: "RNOR status gives returning NRIs a temporary period where foreign income is completely tax-free in India. Most miss it.",
    category: "NRI Planning",
    date: "March 2025",
    readTime: 7,
    author: "Valura Research",
    accentColor: "#B8913A",
    excerpt: "Resident but Not Ordinarily Resident status is the most powerful — and least understood — tax planning tool available to returning NRIs. It typically lasts 2–3 years. Here is how to use it.",
    relatedCalc: { label: "NRI Status Calculator", href: "/calculators/nri-status" },
    sections: [
      {
        heading: "The three residency statuses under Section 6",
        body: "India's Income Tax Act recognises three residency statuses, not two. Most people think of 'Resident' and 'NRI'. The full classification is NRI (Non-Resident Indian), RNOR (Resident but Not Ordinarily Resident), and ROR (Resident and Ordinarily Resident). The practical tax difference is enormous. NRIs: only Indian-sourced income is taxable in India. Foreign income is completely outside Indian tax. ROR (ordinary residents): worldwide income is fully taxable in India — all foreign dividends, foreign capital gains, foreign interest, everything. RNOR status sits in between: technically resident (you have crossed the 182-day threshold), but treated as non-resident for the purpose of foreign income. This means your foreign income is NOT taxable in India during your RNOR period.",
      },
      {
        heading: "When RNOR status applies",
        body: "You qualify as RNOR if you are technically resident in India for the current financial year (spent 182+ days or 60+ days + 365 days in preceding 4 FYs), AND either: you were an NRI in at least 9 of the 10 preceding financial years, OR you spent 729 days or fewer in India across the 7 preceding financial years combined. In practice, almost every returning NRI who spent significant time abroad qualifies for RNOR for at least 2 financial years after returning. For someone returning after 10 continuous years abroad, RNOR can last up to 3 financial years.",
      },
      {
        heading: "What RNOR means for your foreign portfolio",
        body: "During your RNOR period, your foreign investment income — dividends from US stocks, capital gains on Irish ETFs, interest on foreign bonds — is not taxable in India. You do still need to pay tax in the source country (the US will withhold NRA tax on dividends regardless), but India will not layer on top of it. You also do not need to file Schedule FA for foreign assets during RNOR (though it is good practice to maintain records). LRS still applies — you are technically resident, so the ₹10L TCS threshold and $250,000 annual limit both apply. But the foreign income itself is off India's radar.",
      },
      {
        type: "callout",
        calloutTitle: "The compounding implication",
        body: "Kavitha returned from Singapore in April 2024 after 9 years abroad. In FY 2025-26, she qualifies as RNOR. Her Singapore savings portfolio generates $40,000/year in dividends and capital gains. As RNOR: $0 taxable in India. As ROR (next year): $40,000 × ₹84.50 × 30% (slab) = ~₹10.1L in Indian tax per year on the same portfolio. Kavitha has approximately 2 financial years to restructure her portfolio before ROR status kicks in and the full Indian tax burden applies.",
      },
      {
        heading: "How to use the RNOR window strategically",
        body: "The RNOR window is finite and precious. The right strategy depends on your specific timeline, but there are four moves that almost always make sense. First, realise large foreign capital gains during RNOR — if you have unrealised gains on foreign stocks, selling during RNOR means paying no Indian tax on those gains. You will still owe source country tax, but that is typically lower. Second, restructure your portfolio into GIFT City IFSC vehicles. When you eventually become ROR, GIFT City investments are still tax-efficient: 14.95% LTCG max, Schedule FA auto-generated, FTC via Form 67 for dividend WHT. Third, do not bring all foreign assets to India during RNOR — once they become Indian-located, they are taxed as Indian assets. Keep foreign assets abroad or move them to GIFT City IFSC. Fourth, check your status carefully using the NRI Status calculator — RNOR conditions are precise and the qualifying period can vary.",
      },
      {
        heading: "The countdown: days remaining in your RNOR window",
        body: "RNOR status does not renew. It counts down from the moment you first qualify. The NRI Status calculator shows your exact status, which RNOR condition you qualify under (NRI for 9 of 10 years, or ≤729 days in 7 years), and approximately when your RNOR window closes. For most returning NRIs, the window is 2 financial years. For those returning after longer absences (10+ years abroad), it can be 3 years. Every financial year you let pass without restructuring your portfolio is a financial year of foregone optimization.",
      },
      {
        type: "tip",
        body: "When you become ROR, Schedule FA disclosure in ITR-2 or ITR-3 becomes mandatory for all foreign assets — including GIFT City IFSC investments (which are classified as foreign assets under FEMA). Valura auto-generates Schedule FA data for your GIFT City holdings, making this compliance obligation straightforward.",
      },
    ],
  },
];
