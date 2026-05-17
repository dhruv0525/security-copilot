export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface Scan {
  id: string;
  domain: string;
  url: string;
  trustScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  detectionSource: string;
  scannedAt: string;
  threatCategory?: string;
}

export interface Signal {
  id: string;
  name: string;
  label: string;
  severity: RiskLevel;
  explanation: string;
  weight: number;
  detected: boolean;
}

export interface ScanDetail extends Scan {
  aiSummary: string;
  aiReasoning: string;
  recommendations: string[];
  signals: Signal[];
  ssl: {
    issuer: string;
    validFrom: string;
    validTo: string;
    isExpired: boolean;
    isSelfSigned: boolean;
    daysRemaining: number;
  };
  whois: {
    registrar: string;
    registeredAt: string;
    expiresAt: string;
    domainAgeDays: number;
    country: string;
    privacyProtected: boolean;
  };
  reputation: {
    googleSafeBrowsing: "clean" | "flagged" | "unknown";
    virusTotal: "clean" | "flagged" | "unknown" | "pending";
    phishTank: "clean" | "flagged" | "unknown" | "pending";
  };
  confidenceFactors: {
    legitimacy: string[];
    uncertainty: string[];
  };
}

// ─── Overview metrics ───────────────────────────────────────────────────────

export const overviewMetrics = {
  totalScans: 14_823,
  threatsDetected: 1_247,
  safeSites: 12_841,
  highRiskDomains: 389,
  avgConfidence: 87.4,
  sslIssues: 214,
};

// ─── Chart data ─────────────────────────────────────────────────────────────

export const riskDistribution = [
  { name: "Critical", value: 89, color: "var(--risk-critical)" },
  { name: "High", value: 300, color: "var(--risk-high)" },
  { name: "Medium", value: 858, color: "var(--risk-medium)" },
  { name: "Low", value: 1204, color: "var(--risk-low)" },
  { name: "Safe", value: 12372, color: "var(--risk-safe)" },
];

export const scanActivity = [
  { date: "Apr 21", scans: 420, threats: 38 },
  { date: "Apr 22", scans: 380, threats: 29 },
  { date: "Apr 23", scans: 510, threats: 52 },
  { date: "Apr 24", scans: 490, threats: 44 },
  { date: "Apr 25", scans: 620, threats: 61 },
  { date: "Apr 26", scans: 540, threats: 47 },
  { date: "Apr 27", scans: 460, threats: 31 },
  { date: "Apr 28", scans: 590, threats: 58 },
  { date: "Apr 29", scans: 670, threats: 72 },
  { date: "May 30", scans: 720, threats: 65 },
  { date: "May 01", scans: 650, threats: 55 },
  { date: "May 02", scans: 710, threats: 68 },
  { date: "May 03", scans: 530, threats: 41 },
  { date: "May 04", scans: 490, threats: 35 },
];

export const threatCategories = [
  { name: "Phishing", count: 541 },
  { name: "Malware", count: 213 },
  { name: "Scam", count: 187 },
  { name: "Suspicious TLD", count: 156 },
  { name: "SSL Issues", count: 150 },
];

export const confidenceDistribution = [
  { range: "90–100%", count: 4820 },
  { range: "75–89%", count: 6310 },
  { range: "60–74%", count: 2140 },
  { range: "40–59%", count: 980 },
  { range: "< 40%", count: 573 },
];

// ─── Recent threats ──────────────────────────────────────────────────────────

export const recentThreats: Scan[] = [
  {
    id: "s001",
    domain: "paypal-secure-login.com",
    url: "https://paypal-secure-login.com/verify",
    trustScore: 4,
    riskLevel: "critical",
    confidence: 97,
    confidenceLevel: "high",
    detectionSource: "Google Safe Browsing",
    scannedAt: "2025-05-17T14:32:00Z",
    threatCategory: "Phishing",
  },
  {
    id: "s002",
    domain: "amazon-deals-today.xyz",
    url: "https://amazon-deals-today.xyz/checkout",
    trustScore: 11,
    riskLevel: "critical",
    confidence: 94,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T13:58:00Z",
    threatCategory: "Scam",
  },
  {
    id: "s003",
    domain: "microsoft-support-help.net",
    url: "https://microsoft-support-help.net/fix",
    trustScore: 18,
    riskLevel: "high",
    confidence: 89,
    confidenceLevel: "high",
    detectionSource: "Signal Analysis",
    scannedAt: "2025-05-17T13:21:00Z",
    threatCategory: "Phishing",
  },
  {
    id: "s004",
    domain: "crypto-wallet-recover.io",
    url: "https://crypto-wallet-recover.io/restore",
    trustScore: 7,
    riskLevel: "critical",
    confidence: 96,
    confidenceLevel: "high",
    detectionSource: "Google Safe Browsing",
    scannedAt: "2025-05-17T12:45:00Z",
    threatCategory: "Scam",
  },
  {
    id: "s005",
    domain: "login-bankofamerica.info",
    url: "https://login-bankofamerica.info/signin",
    trustScore: 3,
    riskLevel: "critical",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Google Safe Browsing",
    scannedAt: "2025-05-17T12:12:00Z",
    threatCategory: "Phishing",
  },
  {
    id: "s006",
    domain: "free-iphone-winner.top",
    url: "https://free-iphone-winner.top/claim",
    trustScore: 9,
    riskLevel: "critical",
    confidence: 95,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T11:54:00Z",
    threatCategory: "Scam",
  },
  {
    id: "s007",
    domain: "update-netflix-billing.com",
    url: "https://update-netflix-billing.com/payment",
    trustScore: 14,
    riskLevel: "high",
    confidence: 91,
    confidenceLevel: "high",
    detectionSource: "Signal Analysis",
    scannedAt: "2025-05-17T11:22:00Z",
    threatCategory: "Phishing",
  },
];

// ─── Scan history ────────────────────────────────────────────────────────────

export const scanHistory: Scan[] = [
  ...recentThreats,
  {
    id: "s008",
    domain: "github.com",
    url: "https://github.com",
    trustScore: 98,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T11:00:00Z",
  },
  {
    id: "s009",
    domain: "docs.google.com",
    url: "https://docs.google.com",
    trustScore: 99,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T10:45:00Z",
  },
  {
    id: "s010",
    domain: "suspicious-redirect.cc",
    url: "https://suspicious-redirect.cc/track",
    trustScore: 32,
    riskLevel: "medium",
    confidence: 74,
    confidenceLevel: "medium",
    detectionSource: "Signal Analysis",
    scannedAt: "2025-05-17T10:30:00Z",
    threatCategory: "Suspicious TLD",
  },
  {
    id: "s011",
    domain: "stripe.com",
    url: "https://stripe.com/docs",
    trustScore: 97,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T10:10:00Z",
  },
  {
    id: "s012",
    domain: "cheap-meds-online.ru",
    url: "https://cheap-meds-online.ru/order",
    trustScore: 19,
    riskLevel: "high",
    confidence: 88,
    confidenceLevel: "high",
    detectionSource: "Signal Analysis",
    scannedAt: "2025-05-17T09:55:00Z",
    threatCategory: "Scam",
  },
  {
    id: "s013",
    domain: "vercel.com",
    url: "https://vercel.com",
    trustScore: 98,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T09:40:00Z",
  },
  {
    id: "s014",
    domain: "unknown-tracker.biz",
    url: "https://unknown-tracker.biz/pixel",
    trustScore: 41,
    riskLevel: "medium",
    confidence: 68,
    confidenceLevel: "medium",
    detectionSource: "Signal Analysis",
    scannedAt: "2025-05-17T09:22:00Z",
    threatCategory: "Suspicious TLD",
  },
  {
    id: "s015",
    domain: "cloudflare.com",
    url: "https://cloudflare.com",
    trustScore: 99,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T09:05:00Z",
  },
  {
    id: "s016",
    domain: "account-google-security.net",
    url: "https://account-google-security.net/verify",
    trustScore: 6,
    riskLevel: "critical",
    confidence: 98,
    confidenceLevel: "high",
    detectionSource: "Google Safe Browsing",
    scannedAt: "2025-05-17T08:50:00Z",
    threatCategory: "Phishing",
  },
  {
    id: "s017",
    domain: "npmjs.com",
    url: "https://npmjs.com",
    trustScore: 95,
    riskLevel: "safe",
    confidence: 99,
    confidenceLevel: "high",
    detectionSource: "Trust Engine",
    scannedAt: "2025-05-17T08:30:00Z",
  },
];

// ─── Scan detail (for the detail page) ──────────────────────────────────────

export const scanDetail: ScanDetail = {
  id: "s001",
  domain: "paypal-secure-login.com",
  url: "https://paypal-secure-login.com/verify",
  trustScore: 4,
  riskLevel: "critical",
  confidence: 97,
  confidenceLevel: "high",
  detectionSource: "Google Safe Browsing",
  scannedAt: "2025-05-17T14:32:00Z",
  threatCategory: "Phishing",

  aiSummary:
    "This domain is a high-confidence phishing site impersonating PayPal. It mimics PayPal's login UI to harvest account credentials and financial details from unsuspecting users.",
  aiReasoning:
    "The domain was registered 6 days ago, uses a suspicious TLD structure that mimics the legitimate paypal.com domain, and has been confirmed by Google Safe Browsing as a known phishing vector. Combined with a self-signed SSL certificate and zero domain reputation, the Trust Engine assigns this the lowest possible trust score.",
  recommendations: [
    "Do not enter any credentials or personal information on this site.",
    "Report the domain to Google Safe Browsing via safebrowsing.google.com.",
    "If credentials were entered, change your PayPal password immediately.",
    "Enable two-factor authentication on your PayPal account.",
  ],

  signals: [
    {
      id: "sig1",
      name: "google_flagged_phishing",
      label: "Google Safe Browsing Flagged",
      severity: "critical",
      explanation: "Google Safe Browsing has confirmed this URL as an active phishing page.",
      weight: 0.92,
      detected: true,
    },
    {
      id: "sig2",
      name: "young_domain",
      label: "Very Young Domain",
      severity: "high",
      explanation: "Domain was registered only 6 days ago. Phishing sites typically have very short lifespans.",
      weight: 0.78,
      detected: true,
    },
    {
      id: "sig3",
      name: "suspicious_tld",
      label: "Suspicious TLD Pattern",
      severity: "high",
      explanation: "The domain name mimics 'paypal.com' with appended keywords — a classic typosquatting technique.",
      weight: 0.75,
      detected: true,
    },
    {
      id: "sig4",
      name: "expired_certificate",
      label: "Self-Signed Certificate",
      severity: "medium",
      explanation: "The SSL certificate is self-signed and not issued by a trusted CA. Legitimate services never use self-signed certs.",
      weight: 0.61,
      detected: true,
    },
    {
      id: "sig5",
      name: "no_domain_history",
      label: "No Domain History",
      severity: "medium",
      explanation: "No prior crawl history, reputation data, or indexed pages found for this domain.",
      weight: 0.55,
      detected: true,
    },
    {
      id: "sig6",
      name: "domain_resolution_failed",
      label: "Abnormal DNS Configuration",
      severity: "low",
      explanation: "DNS records show unusual A-record patterns inconsistent with a legitimate business deployment.",
      weight: 0.32,
      detected: true,
    },
  ],

  ssl: {
    issuer: "Self-Signed",
    validFrom: "2025-05-11T00:00:00Z",
    validTo: "2025-06-11T00:00:00Z",
    isExpired: false,
    isSelfSigned: true,
    daysRemaining: 25,
  },

  whois: {
    registrar: "Namecheap, Inc.",
    registeredAt: "2025-05-11T00:00:00Z",
    expiresAt: "2026-05-11T00:00:00Z",
    domainAgeDays: 6,
    country: "US",
    privacyProtected: true,
  },

  reputation: {
    googleSafeBrowsing: "flagged",
    virusTotal: "flagged",
    phishTank: "pending",
  },

  confidenceFactors: {
    legitimacy: [],
    uncertainty: [
      "No prior domain history available for baseline comparison",
      "PhishTank results pending — awaiting community verification",
      "VirusTotal scan returned partial results from 3 of 70 engines",
    ],
  },
};
