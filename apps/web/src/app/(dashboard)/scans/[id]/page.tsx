"use client";

import { use, useMemo } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { scansApi } from "@/lib/api/scans";
import { ScanDetailHeader } from "@/components/dashboard/scan-detail-header";
import {
  AiExplanationCard,
  SignalsCard,
  SslCard,
  WhoisCard,
  ReputationCard,
  ConfidenceAnalysisCard,
} from "@/components/dashboard/scan-detail-cards";
import type { ScanDetail } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ScanDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["scans", "detail", id],
    queryFn: () => scansApi.getById(id),
    enabled: !!id,
  });

  const scan = useMemo((): ScanDetail | null => {
    if (!data) return null;
    const ts = data.trust_score;

    // 1. Map reputation
    const rep = (data.reputation || {}) as any;
    const mappedRep = {
      googleSafeBrowsing: (rep.google_safe_browsing || rep.googleSafeBrowsing || "clean") as "clean" | "flagged" | "unknown",
      virusTotal: (rep.virustotal || rep.virusTotal || "clean") as "clean" | "flagged" | "unknown",
      phishTank: (rep.phishtank || rep.phishTank || "clean") as "clean" | "flagged" | "unknown",
    };

    // 2. Map SSL
    const ssl = (data.ssl_info || {}) as any;
    const mappedSsl = {
      issuer: ssl.issuer || "Unknown Issuer",
      validFrom: ssl.valid_from || ssl.validFrom || new Date().toISOString(),
      validTo: ssl.valid_to || ssl.validTo || new Date().toISOString(),
      isExpired: !!ssl.is_expired || !!ssl.isExpired || false,
      isSelfSigned: !!ssl.is_self_signed || !!ssl.isSelfSigned || false,
      daysRemaining: typeof ssl.days_remaining === "number" ? ssl.days_remaining : (typeof ssl.daysRemaining === "number" ? ssl.daysRemaining : 365),
    };

    // 3. Map WHOIS
    const dom = (data.domain_info || {}) as any;
    const mappedWhois = {
      registrar: dom.registrar || "Unknown Registrar",
      registeredAt: dom.registered_at || dom.registeredAt || new Date().toISOString(),
      expiresAt: dom.expires_at || dom.expiresAt || new Date().toISOString(),
      domainAgeDays: typeof dom.age_days === "number" ? dom.age_days : (typeof dom.ageDays === "number" ? dom.ageDays : 1),
      country: dom.country || "US",
      privacyProtected: !!dom.privacy_protected || !!dom.privacyProtected || false,
    };

    // 4. Map Heuristic Signals
    const mappedSignals = (ts.signals || []).map((sig: any, index: number) => ({
      id: sig.id || `sig_${index}`,
      name: sig.name || sig.rule_id || "rule",
      label: sig.label || sig.name || "Signal Detected",
      severity: (sig.severity || "low") as any,
      explanation: sig.explanation || sig.description || "",
      weight: sig.weight || 0.1,
      detected: sig.detected !== false,
    }));

    return {
      id: data.id,
      domain: data.domain,
      url: data.url,
      trustScore: ts.score,
      riskLevel: ts.level as any,
      confidence: Math.round(ts.score),
      confidenceLevel: (ts.confidence || "medium") as any,
      detectionSource: "Trust Engine Scan",
      scannedAt: data.scanned_at,
      threatCategory: ts.dominant_category ? ts.dominant_category.replace(/_/g, " ") : undefined,
      
      aiSummary: ts.explanation || "No AI explanation available.",
      aiReasoning: ts.recommendation || "No detailed reasoning logged.",
      recommendations: ts.issues?.map((issue: any) => issue.description) || [ts.recommendation || "Maintain standard browsing safeguards."],
      signals: mappedSignals,
      ssl: mappedSsl,
      whois: mappedWhois,
      reputation: mappedRep,
      confidenceFactors: {
        legitimacy: ts.score >= 50 ? ["SSL Validation active and certified", "Legitimate WHOIS records registered"] : [],
        uncertainty: ts.score < 50 ? ["Abnormal domain registrars identified", "Elevated intelligence heuristic counts"] : [],
      },
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-16 w-full bg-muted rounded" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-44 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <ScanDetailHeader scan={scan} />

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <AiExplanationCard scan={scan} />
          <SignalsCard scan={scan} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SslCard scan={scan} />
          <WhoisCard scan={scan} />
          <ReputationCard scan={scan} />
          <ConfidenceAnalysisCard scan={scan} />
        </div>
      </div>
    </div>
  );
}
