// ─── Types ────────────────────────────────────────────────────────────────

export type InvestorType = "resident" | "nri" | "foreign";

export type JourneyId =
  | "ri_global_invest"
  | "ri_tax_reduce"
  | "ri_family_wealth"
  | "ri_itr_guide"
  | "nri_global_invest"
  | "nri_rnor_window"
  | "nri_repatriation"
  | "nri_india_invest"
  | "fn_global"
  | "fn_india";

export type CalculatorType =
  | "tcs_basic"
  | "family_tcs"
  | "waiting_game"
  | "tlh_savings"
  | "family_capacity"
  | "nri_status_simple";

export interface RateTableRow {
  bracket: string;
  stcg: string;
  ltcg: string;
  saving: string;
}

export interface ChecklistItem {
  text: string;
}

export interface JourneyStep {
  id: string;
  title: string;
  plainEnglish: string;
  whatThisMeans?: string;
  tip?: string;
  danger?: string;
  callout?: string;
  calculator?: CalculatorType;
  calculatorLink?: string;      // href to the full calculator page
  calculatorLabel?: string;     // CTA label, e.g. "Open full TCS calculator"
  documents?: string[];
  checklist?: ChecklistItem[];
  rateTable?: RateTableRow[];
  visual?: "lrs" | "tcs" | "gains" | "estate" | "nri" | "family" | "tlh" | "dtaa" | "compliance";
}

export interface UseCaseCard {
  journeyId: JourneyId;
  title: string;
  description: string;
  icon: "chart" | "shield" | "people" | "document" | "globe" | "plane" | "house";
}

export interface Journey {
  id: JourneyId;
  title: string;
  investorType: InvestorType;
  steps: JourneyStep[];
}

// ─── Use case cards per investor type ────────────────────────────────────

export const USE_CASES: Record<InvestorType, UseCaseCard[]> = {
  resident: [
    {
      journeyId: "ri_global_invest",
      icon: "chart",
      title: "Invest in US stocks and global ETFs",
      description: "Buy Apple, S&P 500 ETFs, and global funds. We'll handle the paperwork and tax.",
    },
    {
      journeyId: "ri_tax_reduce",
      icon: "shield",
      title: "Pay less tax on my investments",
      description: "Reduce your capital gains tax using legal strategies most investors don't know.",
    },
    {
      journeyId: "ri_family_wealth",
      icon: "people",
      title: "Invest as a family and save more",
      description: "A family of 4 can invest ₹40 lakh completely tax-free per year.",
    },
    {
      journeyId: "ri_itr_guide",
      icon: "document",
      title: "Understand what I need to file in my ITR",
      description: "GIFT City investments need special disclosures. We'll guide you.",
    },
  ],
  nri: [
    {
      journeyId: "nri_global_invest",
      icon: "chart",
      title: "Invest globally with no limits",
      description: "No annual cap, no TCS. Invest via your GIFT City account from anywhere in the world.",
    },
    {
      journeyId: "nri_rnor_window",
      icon: "shield",
      title: "I just moved back to India",
      description: "You likely qualify for a special 2-year tax window. We'll calculate it for you.",
    },
    {
      journeyId: "nri_repatriation",
      icon: "plane",
      title: "Send money home tax-efficiently",
      description: "NRE accounts allow free repatriation. We'll show you the most efficient route.",
    },
    {
      journeyId: "nri_india_invest",
      icon: "house",
      title: "Plan my India investments",
      description: "Invest in Indian markets through GIFT City with DTAA protection.",
    },
  ],
  foreign: [
    {
      journeyId: "fn_global",
      icon: "globe",
      title: "Access global markets via GIFT City",
      description: "100+ nationalities welcome. No Indian tax on gains. Full repatriation.",
    },
    {
      journeyId: "fn_india",
      icon: "chart",
      title: "Invest in Indian markets",
      description: "Access Nifty, Indian funds, and bonds through Valura's GIFT City platform.",
    },
  ],
};

// ─── Journey content ──────────────────────────────────────────────────────

export const JOURNEYS: Record<JourneyId, Journey> = {

  // ══════════════════════════════════════════════
  ri_global_invest: {
    id: "ri_global_invest",
    title: "How to invest in global stocks from India",
    investorType: "resident",
    steps: [
      {
        id: "account",
        title: "Create your Valura account",
        plainEnglish:
          "Sign up with your mobile number and email. Takes 60 seconds. You don't need to visit a branch or print any documents.",
        whatThisMeans:
          "Your account will be with Valura, a regulated platform in GIFT City — India's special financial zone in Gandhinagar, Gujarat. Think of GIFT City like a duty-free zone, but for investing: different rules apply here, and they're more investor-friendly.",
        documents: ["Mobile number", "Email address"],
      },
      {
        id: "kyc",
        title: "Verify your identity (KYC)",
        plainEnglish:
          "We need to confirm who you are. For Indian residents, this takes under 2 minutes using your Aadhaar and PAN card — no paperwork, no office visits. Everything happens on your phone.",
        whatThisMeans:
          "KYC stands for 'Know Your Customer'. It's a regulatory requirement — the same thing you do when you open a bank account, but fully digital here. Once done, it never needs to be repeated.",
        documents: ["Aadhaar card", "PAN card"],
      },
      {
        id: "gift_city_account",
        title: "Your GIFT City account opens",
        plainEnglish:
          "Once verified, Valura opens a special investment account for you in GIFT City. This account is denominated in US Dollars, so your investments are automatically in USD — hedging you against INR depreciation over time.",
        whatThisMeans:
          "GIFT City is treated as 'outside India' by law, which means you can invest in global stocks from here without the SEBI restrictions that apply to other Indian platforms. Apps like Zerodha or Groww cannot offer unlimited overseas investing — Valura can.",
        tip: "Unlike Indian mutual funds investing abroad (which hit a $7 billion industry-wide cap and frequently stop accepting money), your Valura GIFT City account has no such cap. You can invest year-round, always.",
      },
      {
        id: "lrs_basics",
        title: "How to send money to your account (LRS)",
        plainEnglish:
          "To invest globally, you send money from your Indian bank account to your GIFT City account. This is called LRS — the RBI's Liberalised Remittance Scheme (the government's permission to invest abroad). You can send up to $2,50,000 (about ₹2.1 crore) per year.",
        whatThisMeans:
          "Your bank will deduct a small tax called TCS (Tax Collected at Source) when you send money above ₹10 lakh (about $12,000) in a year. This is not a permanent cost — you get every rupee back when you file your income tax return. It's just a timing difference, not an extra charge.",
        calculator: "tcs_basic",
        calculatorLink: "/calculators/lrs-tcs",
        calculatorLabel: "Open full LRS & TCS calculator",
        visual: "tcs",
      },
      {
        id: "tcs_optimize",
        title: "The smart way to send money (TCS optimization)",
        plainEnglish:
          "Every adult in your family gets their own ₹10 lakh limit before TCS applies. So if you involve your spouse and one adult child, your family can send ₹30 lakh per year with zero TCS deducted upfront. The money works for you from day one.",
        whatThisMeans:
          "This is completely legal and specifically how the government designed it. Each person has their own PAN card and their own ₹10 lakh limit. Valura's LRS tracker helps you coordinate this automatically — it shows each person's used and remaining limit in one dashboard.",
        calculator: "family_tcs",
        calculatorLink: "/calculators/lrs-tcs",
        calculatorLabel: "Optimize across your family →",
        tip: "A family of 4 adults can invest ₹40 lakh every year with exactly ₹0 TCS deducted. That's ₹40 lakh working for you from day one, not sitting with the tax department waiting to be refunded.",
        visual: "family",
      },
      {
        id: "investing",
        title: "Investing in global markets",
        plainEnglish:
          "Once your money arrives in your GIFT City account, you can buy US stocks (Apple, Google, Amazon), S&P 500 ETFs, global ETFs, and funds. Valura uses ViewTrade as its trading partner to access 50+ exchanges worldwide.",
        whatThisMeans:
          "You're buying real international securities — the same Apple stock someone in New York buys. These are held in your name, in your account. This is not a mutual fund that invests overseas on your behalf — it's direct ownership.",
        callout: "Zero STT (Securities Transaction Tax), zero stamp duty, zero GST on your trades. These are GIFT City advantages that don't exist on any Indian domestic platform.",
      },
      {
        id: "tax_on_gains",
        title: "Tax on your profits",
        plainEnglish:
          "When you sell investments at a profit, you pay capital gains tax (a tax on your investment profit). The key rule: hold for more than 2 years (730 days), and you pay only 12.5% tax. Sell earlier, and you pay tax at your income slab rate — which can reach 42.74% for high earners.",
        whatThisMeans:
          "The difference between selling after 2 years vs. before 2 years can be enormous. On a ₹50 lakh profit, waiting past the 2-year mark could save you over ₹14 lakh in tax — more than the return on many investments.",
        calculator: "waiting_game",
        calculatorLink: "/calculators/capital-gains",
        calculatorLabel: "Calculate your exact capital gains tax",
        tip: "India has no 'wash sale rule' unlike the USA. If a position drops in value, you can sell it to book a loss (which reduces your tax) and immediately rebuy the same investment. Valura's TLH engine does this automatically.",
        visual: "gains",
      },
    ],
  },

  // ══════════════════════════════════════════════
  ri_tax_reduce: {
    id: "ri_tax_reduce",
    title: "How to legally pay less tax on your investments",
    investorType: "resident",
    steps: [
      {
        id: "why_overpay",
        title: "Why most investors overpay tax",
        plainEnglish:
          "If you sell a profitable investment within 2 years of buying it, you pay tax at your income slab rate — up to 42.74% for high earners. If you hold for just over 2 years (730 days), the rate drops to a maximum of 14.95%, regardless of your income.",
        whatThisMeans:
          "The government caps the tax on long-term investment profits at 14.95% no matter how high your income is. So a person earning ₹10 crore pays the same capital gains tax rate as someone earning ₹20 lakh — as long as they both hold for 2 years. Timing is everything.",
        rateTable: [
          { bracket: "Up to ₹50L",    stcg: "~5–15%",  ltcg: "13%",    saving: "₹0–₹20K per ₹1L gain" },
          { bracket: "₹50L – ₹1Cr",   stcg: "~20%",    ltcg: "13%",    saving: "₹7K per ₹1L gain" },
          { bracket: "₹1Cr – ₹2Cr",   stcg: "~34.32%", ltcg: "14.95%", saving: "₹19K per ₹1L gain" },
          { bracket: "₹2Cr – ₹5Cr",   stcg: "~39%",    ltcg: "14.95%", saving: "₹24K per ₹1L gain" },
          { bracket: "Above ₹5Cr",     stcg: "42.74%",  ltcg: "14.95%", saving: "₹28K per ₹1L gain" },
        ],
      },
      {
        id: "tlh",
        title: "Tax Loss Harvesting — India's hidden advantage",
        plainEnglish:
          "If any of your investments have dropped in value, you can sell them to create a tax 'loss'. This loss reduces the tax you owe on your profitable investments. The powerful part: in India, you can sell and immediately rebuy the same investment — the loss still counts legally.",
        whatThisMeans:
          "In the USA, there is a 'wash sale rule' — you must wait 30 days before buying back the same stock after selling it for a loss. India has no such rule. So Valura can sell your losing position, book the tax loss, and immediately rebuy it. Your portfolio doesn't change — your tax bill goes down.",
        calculator: "tlh_savings",
        calculatorLink: "/tlh",
        calculatorLabel: "Open TLH engine — scan your portfolio",
        visual: "tlh",
      },
      {
        id: "waiting_game",
        title: "The 730-day countdown",
        plainEnglish:
          "For every investment you hold, there's a countdown to the 2-year (730-day) mark. Selling one day before it can cost you massively. Selling one day after can save you thousands of rupees on the same gain.",
        whatThisMeans:
          "Valura tracks every position's holding period automatically. When any of your investments approaches the 730-day mark, we alert you: 'Don't sell yet — wait X more days and save ₹Y in tax.' No spreadsheets needed.",
        calculator: "waiting_game",
        calculatorLink: "/calculators/capital-gains",
        calculatorLabel: "See the full capital gains breakdown",
        visual: "gains",
      },
      {
        id: "schedule_fa",
        title: "Schedule FA — the disclosure most investors miss",
        plainEnglish:
          "If you invest through GIFT City, your holdings count as 'foreign assets' in Indian law — even though GIFT City is physically inside India. You must declare them in your income tax return every year in a section called Schedule FA. Most investors don't know this exists.",
        whatThisMeans:
          "This is not optional and not complicated once you know about it. Valura generates a pre-filled Schedule FA report every year with all the numbers you need to paste into your ITR. Takes 5 minutes with your CA.",
        danger: "₹10 lakh per year penalty for not disclosing foreign assets, under the Black Money Act, 2015. Valura auto-generates your Schedule FA data so you never miss this.",
        calculatorLink: "/chat",
        calculatorLabel: "Build my Schedule FA data with AI",
        visual: "compliance",
      },
      {
        id: "action_plan",
        title: "Your tax action plan for this financial year",
        plainEnglish:
          "Based on everything above, here is exactly what smart investors do before March 31 each year — in order of priority.",
        whatThisMeans:
          "Most of this takes under an hour if you use Valura's tools. The TLH engine identifies opportunities automatically. The Schedule FA report is one click. The calculator handles the LTCG timing.",
        checklist: [
          { text: "Check all positions: which are within 60 days of the 730-day mark? Don't sell those — wait." },
          { text: "Check all losing positions: harvest them before March 28 (T+2 settlement means trades must be placed by March 28 to settle before March 31)." },
          { text: "Coordinate LRS timing with advance tax dates (June 15, Sept 15, Dec 15, March 15) to minimize cash locked with the government." },
          { text: "Download your Schedule FA data from Valura before filing your ITR." },
          { text: "File your ITR by July 31 to preserve loss carry-forwards — unused losses can offset gains for up to 8 years." },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  ri_family_wealth: {
    id: "ri_family_wealth",
    title: "How families invest together and save tax",
    investorType: "resident",
    steps: [
      {
        id: "separate_limits",
        title: "Each person gets their own investment limit",
        plainEnglish:
          "India's LRS (Liberalised Remittance Scheme — the government's overseas investment permission) gives every adult in your family a completely separate $2,50,000 per year limit. Each adult also gets a separate ₹10 lakh limit before any tax is collected upfront. These limits are independent — they don't combine or reduce each other.",
        whatThisMeans:
          "A husband and wife can each invest $2,50,000 per year — a total of $5,00,000 (about ₹4.2 crore) between them. Add an adult child and it's $7,50,000. Each person's limit resets to zero on April 1 every year.",
        calculator: "family_capacity",
        calculatorLink: "/calculators/lrs-tcs",
        calculatorLabel: "Optimize your family's LRS allocation",
        visual: "family",
      },
      {
        id: "huf",
        title: "The HUF advantage",
        plainEnglish:
          "A Hindu Undivided Family (HUF) is a separate legal entity in Indian law. If your family has set one up, the HUF gets its own $2,50,000 LRS limit AND its own ₹10 lakh TCS-free limit — completely separate from every individual family member's limits.",
        whatThisMeans:
          "A family of 3 adults plus 1 HUF can invest ₹40 lakh per year with zero TCS. That's ₹40 lakh compounding in global markets from day one, with none of it sitting with the tax department waiting to be refunded.",
        tip: "HUF accounts have their own PAN card, their own ITR filing, and their own LRS limit. Valura supports HUF account opening. Talk to your CA about whether setting up a HUF makes sense for your family.",
      },
      {
        id: "coordination",
        title: "How to coordinate across family members",
        plainEnglish:
          "The key rule: each person must send money from their own bank account to their own GIFT City account. You cannot send ₹30 lakh from one account and claim it as three people's investment. Each person must be the actual sender.",
        whatThisMeans:
          "Practically: your spouse needs their own savings account, and so does each adult child. Each person fills their own Form A2 at their bank when remitting. Valura's LRS Tracker shows every family member's used and remaining limit in one dashboard — no spreadsheets.",
      },
      {
        id: "family_tlh",
        title: "Harvesting losses in the highest-income account",
        plainEnglish:
          "In a family with different income levels, the highest earner benefits most from tax loss harvesting — because they're in the highest tax bracket. Valura's family TLH engine finds losses across all family members' portfolios and recommends harvesting them in the highest-bracket member's account first.",
        whatThisMeans:
          "The same ₹1 lakh loss harvested in a ₹5 crore+ earner's account saves ₹42,744 in tax. In a ₹10 lakh earner's account, the same loss saves only ₹7,800. Where you harvest matters as much as whether you harvest.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  ri_itr_guide: {
    id: "ri_itr_guide",
    title: "How to handle GIFT City investments in your ITR",
    investorType: "resident",
    steps: [
      {
        id: "why_different",
        title: "Why GIFT City is different in your tax return",
        plainEnglish:
          "Even though GIFT City is physically located in Gandhinagar, India, it is treated as 'outside India' for tax and FEMA (foreign exchange law) purposes. This means your Valura GIFT City account is classified as a 'foreign asset' — which changes how you report it in your income tax return.",
        whatThisMeans:
          "If you have a foreign bank account or foreign shares, you must declare them in your ITR. Your GIFT City account is no different. The specific section is called Schedule FA (Foreign Assets). Using the wrong ITR form or skipping this section has serious penalties.",
      },
      {
        id: "schedule_fa",
        title: "What is Schedule FA and what goes in it",
        plainEnglish:
          "Schedule FA is a part of ITR-2 and ITR-3 where you declare all foreign assets. For your GIFT City account, you need to report: the account number, the institution name (Valura), your opening balance, highest balance during the year, closing balance, and total income earned.",
        whatThisMeans:
          "Valura generates a pre-filled Schedule FA report for you every year — all the numbers, in the exact format needed. You copy it into your ITR. Your CA will know exactly where to paste it. The whole process takes under 10 minutes.",
        danger: "Non-disclosure penalty: ₹10 lakh per year under the Black Money and Imposition of Tax Act, 2015. This is not a small fine — it's mandatory disclosure.",
      },
      {
        id: "itr_form",
        title: "Which ITR form to use",
        plainEnglish:
          "If you have GIFT City investments, you must use ITR-2 (if you don't have business income) or ITR-3 (if you do have business income). You cannot use ITR-1, even if your income is simple otherwise. The presence of foreign assets requires the longer form.",
        whatThisMeans:
          "Most salaried investors default to ITR-1 because it's simpler. Once you start investing through GIFT City, you need to upgrade to ITR-2. Inform your CA of this change — many forget to ask clients about foreign accounts.",
      },
      {
        id: "form_67",
        title: "Form 67 — Claiming foreign tax credit",
        plainEnglish:
          "If you received dividends from US stocks or funds via your GIFT City account, the US would have already deducted a withholding tax of about 15% before paying you. Form 67 lets you claim that as a credit against your Indian tax — so you don't pay tax twice on the same income.",
        whatThisMeans:
          "This is called a Foreign Tax Credit. The rule is: you pay the higher of the US tax or the Indian tax — never both added together. Form 67 must be filed by March 31 of the Assessment Year (the year after you earned the income). Missing this deadline means permanently losing the credit.",
        tip: "The Ireland UCITS ETF route that Valura offers reduces US dividend withholding tax from 25% (for direct US stocks) to about 15% (via India-Ireland DTAA). This alone saves meaningful money every year on dividend income.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  nri_global_invest: {
    id: "nri_global_invest",
    title: "How NRIs invest globally with no limits",
    investorType: "nri",
    steps: [
      {
        id: "nri_advantage",
        title: "The NRI advantage over resident Indians",
        plainEnglish:
          "As an NRI, the LRS rules that apply to Indian residents simply don't apply to you. There's no annual cap on how much you can invest. There's no TCS (the upfront tax that residents pay when sending money above ₹10 lakh). You invest any amount, any time, via wire transfer from your foreign bank account.",
        whatThisMeans:
          "A resident Indian can invest a maximum of $2,50,000 (about ₹2.1 crore) per year abroad. You have no such limit. A $5 million investment is just as easy as a $50,000 one. This makes Valura GIFT City particularly powerful for NRIs building serious wealth.",
      },
      {
        id: "nri_kyc",
        title: "Your KYC verification process",
        plainEnglish:
          "Because you're based overseas, your identity verification is done via Video KYC — a short 10-15 minute video call where you show your passport and answer a few questions. No need to visit India. No notarisation of documents.",
        whatThisMeans:
          "The address proof must be from your country of residence — not an Indian address. Utility bills, bank statements, or government-issued ID with your foreign address all work. Valura's compliance team handles all FATF country checks automatically during this step.",
        documents: [
          "Valid passport (at least 6 months validity remaining)",
          "Foreign address proof (utility bill or bank statement, less than 3 months old)",
          "Your country's tax ID number (e.g. SSN for USA, NI number for UK)",
        ],
      },
      {
        id: "nri_funding",
        title: "Sending money to your GIFT City account",
        plainEnglish:
          "Wire transfer from your foreign bank account in USD, GBP, EUR, AED, or SGD directly to GloboPay's GIFT City receiving account. From there it credits to your Valura account, typically the next business day.",
        whatThisMeans:
          "You don't need to route money through an NRE account first. You can wire directly from your overseas bank — from your Chase account in New York, your Emirates NBD account in Dubai, or your HSBC account in London. The money arrives in your account in US dollars.",
        callout: "NRIs do NOT pay TCS. The 20% upfront tax collection is only for Indian residents remitting under LRS. Your international wire transfer is completely clean — no tax deducted at source.",
      },
      {
        id: "nri_tax",
        title: "Tax on your investment gains as an NRI",
        plainEnglish:
          "If you invest in GIFT City's Category III funds (AIFs — Alternative Investment Funds), your gains are completely exempt from Indian tax under Section 10(23FBC) of the Income Tax Act. Zero percent Indian tax.",
        whatThisMeans:
          "This is one of the most underused advantages in Indian investing. NRIs living in Dubai or Singapore pay zero Indian tax on their GIFT City fund gains. And UAE and Singapore also have no personal income tax. The net tax on your global investment gains can be literally zero.",
        tip: "US Estate Tax trap: If you hold US stocks directly as an Indian citizen, your family faces up to 40% US estate tax on holdings above $60,000 when you die. Via Valura GIFT City, you hold fund units — not US stocks directly. Fund units are not 'US-situs assets'. Your estate tax exposure becomes $0.",
      },
      {
        id: "nri_repatriation",
        title: "Getting your money back",
        plainEnglish:
          "Getting your money out is completely free. Gains from your GIFT City account can be wired back to your NRE account or directly to your foreign bank account. No Indian tax on the transfer. No RBI approval needed for any amount.",
        whatThisMeans:
          "This is fundamentally different from NRO accounts, which have a $1 million per year repatriation limit and require Form 15CA/15CB. Your GIFT City investments are not subject to that limit — full repatriation, unlimited, any time.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  nri_rnor_window: {
    id: "nri_rnor_window",
    title: "Your RNOR tax window — and why it matters urgently",
    investorType: "nri",
    steps: [
      {
        id: "what_is_rnor",
        title: "What is RNOR status?",
        plainEnglish:
          "When you move back to India after being an NRI, you don't immediately become a full Indian taxpayer. For a transition period called RNOR (Resident but Not Ordinarily Resident), your foreign income is NOT taxable in India — even though you're physically living here. This window typically lasts 2 to 3 years.",
        whatThisMeans:
          "During RNOR, you pay Indian tax only on income earned in India — your Indian salary, Indian rent, Indian interest. Your foreign salary, overseas investments, foreign bank interest — none of it is taxable in India during this period. This window is finite and extremely valuable.",
      },
      {
        id: "calculate_rnor",
        title: "Find out if you qualify for RNOR",
        plainEnglish:
          "Your RNOR status depends on your NRI history. If you were an NRI in 9 of the last 10 financial years before returning, or if you spent 729 days or fewer in India across the last 7 years, you qualify for RNOR status.",
        whatThisMeans:
          "Most people who spent 3+ years abroad qualify automatically. The RNOR period lasts until you've been resident for enough years to lose the NRI history. Use the quick calculator below to check — or use our full NRI Status Calculator for a precise answer.",
        calculator: "nri_status_simple",
        calculatorLink: "/calculators/nri-status",
        calculatorLabel: "Get my precise NRI/RNOR/ROR status",
        visual: "nri",
      },
      {
        id: "rnor_actions",
        title: "What to do during your RNOR window",
        plainEnglish:
          "The RNOR period is your golden window. Front-load your global investments now. Any investment gains you realise while RNOR are not taxable in India. After the window closes and you become a full resident (ROR), India will tax your worldwide income including foreign gains.",
        whatThisMeans:
          "Open your Valura GIFT City account now. Invest in global markets. If you have any large positions with unrealised gains, consider realising them during RNOR to avoid Indian tax. Once you become ROR, those same gains will be taxable at up to 14.95%.",
        tip: "Most returning NRIs don't know about RNOR status. By the time they find out, the window has already partially or fully closed. If you've recently returned to India after years abroad, check your RNOR dates immediately — time may be running.",
        checklist: [
          { text: "Open your Valura GIFT City account now — account opening has no tax implications and doesn't affect RNOR status." },
          { text: "Maximise investments during your RNOR period — gains realised now are tax-free in India." },
          { text: "Consider realising gains on existing global positions before the window closes." },
          { text: "Set up Schedule FA disclosure readiness for when you eventually become ROR." },
        ],
      },
      {
        id: "rnor_transition",
        title: "Planning the transition to full resident status",
        plainEnglish:
          "When RNOR ends and you become a full resident (called ROR — Resident and Ordinarily Resident), all your worldwide income becomes taxable in India going forward. But your GIFT City account stays open and working exactly as before.",
        whatThisMeans:
          "The investments don't change, the account doesn't close. You simply start declaring your GIFT City holdings in Schedule FA of your ITR every year, and pay Indian tax on gains from that point. If you've held your GIFT City funds for 2+ years, the gain is taxed at only 14.95% — far lower than most expect.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  nri_repatriation: {
    id: "nri_repatriation",
    title: "Bringing money home tax-efficiently as an NRI",
    investorType: "nri",
    steps: [
      {
        id: "nre_vs_nro",
        title: "NRE vs NRO accounts — the critical difference",
        plainEnglish:
          "You likely have either an NRE account (Non-Resident External) or NRO account (Non-Resident Ordinary) or both at an Indian bank. NRE accounts hold money you earned abroad — completely tax-free in India and fully repatriable. NRO accounts hold Indian income (rent, dividends from Indian stocks) — taxable and repatriation is capped at $1 million per year.",
        whatThisMeans:
          "For most NRIs, the goal is to keep money in NRE accounts whenever possible. Your Valura GIFT City gains can be wired directly back to your NRE account — bypassing the NRO repatriation limits entirely, because GIFT City operates under different rules.",
      },
      {
        id: "gift_city_repatriation",
        title: "How GIFT City repatriation works",
        plainEnglish:
          "When you sell investments in your Valura GIFT City account, the proceeds can be wired to your NRE account or directly to your foreign bank account. No Indian tax on the transfer itself. No RBI approval needed. No Form 15CA or 15CB required.",
        whatThisMeans:
          "This is the most efficient repatriation route available to NRIs. Direct from GIFT City account → NRE account takes 1-2 business days. Direct to a foreign bank takes 2-3 business days. Both are completely unrestricted in amount.",
        callout: "If your gains were from a GIFT City Category III AIF (fund), those gains were already tax-exempt under Section 10(23FBC). So you're repatriating a zero-tax profit. No withholding, no TDS deducted at source.",
      },
      {
        id: "timing",
        title: "Timing your repatriation",
        plainEnglish:
          "If you're in a country with no personal income tax (UAE, Bahrain, Cayman Islands), there's rarely a reason to delay repatriation. If you're in a country with income tax (USA, UK, Australia), the timing of when gains hit your tax return may matter — consult a local tax advisor.",
        whatThisMeans:
          "For UAE-based NRIs: repatriate whenever you like, completely tax-free globally. For US-based NRIs: gains from your GIFT City fund may need to be declared on your US tax return — Valura provides the necessary documentation for this.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  nri_india_invest: {
    id: "nri_india_invest",
    title: "How NRIs invest in Indian markets through GIFT City",
    investorType: "nri",
    steps: [
      {
        id: "india_stocks",
        title: "Investing in Indian stocks as an NRI",
        plainEnglish:
          "As an NRI, you can invest in Indian stocks via two routes: the Portfolio Investment Scheme (PIS) through an NRE/NRO account, or via GIFT City funds that invest in Indian markets. The GIFT City route has tax advantages and avoids the administrative complexity of PIS.",
        whatThisMeans:
          "PIS requires an SEBI-registered broker, a separate demat account, and RBI reporting for every transaction. GIFT City funds are simpler — you invest once into the fund, which professionally manages the Indian allocation for you.",
      },
      {
        id: "dtaa_protection",
        title: "DTAA protection on Indian investment income",
        plainEnglish:
          "India has Double Taxation Avoidance Agreements (DTAA — treaties with other countries to ensure you don't pay tax twice on the same income) with over 90 countries. For NRI investors in Indian securities, these treaties cap the tax India can charge on your gains and dividends.",
        whatThisMeans:
          "For example: if you're an NRI in the UAE and you earn dividends from Indian stocks via GIFT City, India's DTAA with the UAE caps the tax at 10% rather than the standard 20% or 30%. Your home country (UAE) has no income tax. Net tax: 10%.",
        tip: "Mauritius-route funds historically paid 0% capital gains tax on Indian investments due to the India-Mauritius treaty. While this has been partially changed, GIFT City structures still offer meaningful treaty advantages for NRIs in treaty countries.",
      },
      {
        id: "schedule_fa_nri",
        title: "Do NRIs need to file Schedule FA?",
        plainEnglish:
          "No — Schedule FA (the foreign assets disclosure) applies only to resident Indians. As an NRI, India taxes you only on Indian-source income. You are not required to disclose foreign assets in an Indian ITR.",
        whatThisMeans:
          "Your Valura GIFT City account will show up in your tax return as Indian income only (if any Indian-sourced income was earned through it). The full foreign asset disclosure regime doesn't apply to you until you become a resident.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  fn_global: {
    id: "fn_global",
    title: "How international investors access global markets via India",
    investorType: "foreign",
    steps: [
      {
        id: "what_gift_city",
        title: "What is GIFT City?",
        plainEnglish:
          "GIFT City is India's International Financial Services Centre — a special economic zone in Gandhinagar, Gujarat, where international financial rules apply. It functions similarly to Singapore's IBFC or Dubai's DIFC. From GIFT City, investors from 100+ nationalities can access global markets, Indian markets, and specialised funds.",
        whatThisMeans:
          "For you, GIFT City is simply the gateway. Valura is your platform within GIFT City. You'll invest in the same global ETFs, US stocks, and funds available anywhere else — but with specific structural advantages including zero Indian tax on your gains from GIFT City Category III funds.",
      },
      {
        id: "fn_kyc",
        title: "Getting verified",
        plainEnglish:
          "International KYC takes 10-15 minutes via a video call. You'll show your passport and a proof of address from your home country. Valura's compliance team handles FATF country checks and any additional documentation requirements automatically.",
        whatThisMeans:
          "Most countries complete the process in a single video call. A small number of countries on international watch lists require additional documentation but are not blocked entirely. Countries on the FATF black list (North Korea, Iran, Myanmar) are currently not accepted.",
        documents: [
          "Valid passport (at least 6 months remaining validity)",
          "Address proof from your home country (utility bill or bank statement)",
          "Your country's Tax Identification Number (TIN)",
        ],
        callout: "Countries currently not accepted: North Korea, Iran, Myanmar (FATF black list). Grey-listed countries may require additional documentation. Contact Valura's compliance team with any questions about your specific country.",
      },
      {
        id: "fn_funding",
        title: "Sending money and starting to invest",
        plainEnglish:
          "Wire money in USD, EUR, GBP, or SGD to GloboPay's GIFT City account. It arrives in your Valura account the next business day. From there, invest in global ETFs, US stocks, Indian funds, and GIFT City bonds.",
        whatThisMeans:
          "There is no minimum investment amount. There is no maximum. You can wire from any international bank that supports SWIFT transfers.",
      },
      {
        id: "fn_tax",
        title: "Your tax advantages as an international investor",
        plainEnglish:
          "As a non-Indian investor in GIFT City's Category III funds, your gains are exempt from Indian capital gains tax under Section 10(23FBC) of the Indian Income Tax Act. No Indian withholding tax on interest income from GIFT City securities either.",
        whatThisMeans:
          "Your home country's tax rules still apply — Valura provides documentation for your local tax filings. But India takes zero. This makes GIFT City one of the most tax-efficient fund jurisdictions in Asia.",
        tip: "Ireland UCITS ETFs accessed through Valura pay only 15% withholding tax on US dividends versus 25% if you invest directly in US securities. On a $1 million portfolio with a 2% dividend yield, that's $2,000 saved every year just on dividends — before considering any capital gains.",
      },
    ],
  },

  // ══════════════════════════════════════════════
  fn_india: {
    id: "fn_india",
    title: "How international investors access Indian markets",
    investorType: "foreign",
    steps: [
      {
        id: "fn_india_routes",
        title: "How international investors can invest in India",
        plainEnglish:
          "International investors can access Indian markets through two primary routes from GIFT City: direct investment in Indian stocks via the GIFT City stock exchange (NSE IFSC or BSE International), or through GIFT City-based funds that invest in Indian equities and bonds.",
        whatThisMeans:
          "The fund route is simpler for most investors — you invest once and the fund manages the portfolio. The direct route gives you full control over individual Indian stocks and ETFs.",
      },
      {
        id: "fn_india_tax",
        title: "Tax on Indian market gains",
        plainEnglish:
          "For gains on Indian securities from your GIFT City account, Indian capital gains tax applies. Long-term gains (held over 2 years) are taxed at 12.5% — a maximum effective rate of 14.95% with surcharge and cess. Short-term gains are taxed at your applicable rate.",
        whatThisMeans:
          "India has DTAA (Double Taxation Avoidance Agreement — a treaty to prevent you from being taxed twice) with 90+ countries. The treaty will typically allow you to claim the Indian tax paid as a credit in your home country. Most investors effectively pay the higher of their home country's rate or India's 14.95% — not both.",
      },
      {
        id: "fn_india_why",
        title: "Why India, and why now",
        plainEnglish:
          "India is the world's fastest-growing major economy, with a young population and rapidly expanding middle class. Indian equities have delivered strong long-term returns, and the GIFT City route offers international investors a clean, regulated gateway without the complexity of setting up an FPI (Foreign Portfolio Investor) registration.",
        whatThisMeans:
          "FPI registration requires a custodian, legal counsel, and months of setup. Investing through Valura GIFT City can be done in days. Same market exposure, dramatically simpler process.",
      },
    ],
  },
};

// ─── Use case labels (for display) ───────────────────────────────────────

export const JOURNEY_TITLES: Record<JourneyId, string> = {
  ri_global_invest: "Global Investing",
  ri_tax_reduce: "Tax Reduction",
  ri_family_wealth: "Family Wealth",
  ri_itr_guide: "ITR Guide",
  nri_global_invest: "Global Investing",
  nri_rnor_window: "RNOR Window",
  nri_repatriation: "Repatriation",
  nri_india_invest: "India Investing",
  fn_global: "Global Markets",
  fn_india: "Indian Markets",
};
