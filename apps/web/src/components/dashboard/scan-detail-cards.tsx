import {
  ShieldAlert,
  Bot,
  Lock,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanDetail, RiskLevel } from "@/lib/mock-data";
import { RiskBadge } from "./risk-badge";

// ─── Severity icon helper ────────────────────────────────────────────────────

function SeverityIcon({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { icon: React.ReactNode; className: string }> = {
    critical: { icon: <XCircle className="h-4 w-4" />, className: "text-risk-critical" },
    high: { icon: <TriangleAlert className="h-4 w-4" />, className: "text-risk-high" },
    medium: { icon: <AlertCircle className="h-4 w-4" />, className: "text-risk-medium" },
    low: { icon: <Info className="h-4 w-4" />, className: "text-risk-low" },
    safe: { icon: <CheckCircle2 className="h-4 w-4" />, className: "text-risk-safe" },
  };
  const { icon, className } = map[level];
  return <span className={className}>{icon}</span>;
}

// ─── Card shell ──────────────────────────────────────────────────────────────

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── AI Explanation ──────────────────────────────────────────────────────────

export function AiExplanationCard({ scan }: { scan: ScanDetail }) {
  return (
    <Card title="AI Security Analysis" icon={<Bot className="h-4 w-4" />}>
      <div className="space-y-4">
        <div className="rounded-md border border-risk-critical/20 bg-risk-critical/5 p-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {scan.aiSummary}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reasoning
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{scan.aiReasoning}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recommendations
          </p>
          <ul className="space-y-1.5">
            {scan.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-risk-medium">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

// ─── Signals ─────────────────────────────────────────────────────────────────

export function SignalsCard({ scan }: { scan: ScanDetail }) {
  return (
    <Card title="Explainable Signals" icon={<Zap className="h-4 w-4" />}>
      <div className="space-y-2">
        {scan.signals.map((sig) => (
          <div
            key={sig.id}
            className={cn(
              "rounded-md border p-3 transition-colors",
              sig.severity === "critical" && "border-risk-critical/20 bg-risk-critical/5",
              sig.severity === "high" && "border-risk-high/20 bg-risk-high/5",
              sig.severity === "medium" && "border-risk-medium/20 bg-risk-medium/5",
              sig.severity === "low" && "border-border bg-secondary/40",
              sig.severity === "safe" && "border-risk-safe/20 bg-risk-safe/5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon level={sig.severity} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-foreground">{sig.label}</p>
                    <RiskBadge level={sig.severity} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {sig.explanation}
                  </p>
                </div>
              </div>
              {/* Weight bar */}
              <div className="shrink-0 w-20 text-right">
                <p className="text-[10px] text-muted-foreground mb-1">
                  Impact {Math.round(sig.weight * 100)}%
                </p>
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      sig.severity === "critical" && "bg-risk-critical",
                      sig.severity === "high" && "bg-risk-high",
                      sig.severity === "medium" && "bg-risk-medium",
                      sig.severity === "low" && "bg-risk-low",
                      sig.severity === "safe" && "bg-risk-safe"
                    )}
                    style={{ width: `${sig.weight * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── SSL ─────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", accent ? "text-risk-critical" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

export function SslCard({ scan }: { scan: ScanDetail }) {
  const { ssl } = scan;
  return (
    <Card title="SSL / TLS Certificate" icon={<Lock className="h-4 w-4" />}>
      {ssl.isSelfSigned && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-risk-high/30 bg-risk-high/8 px-3 py-2">
          <TriangleAlert className="h-3.5 w-3.5 text-risk-high shrink-0" />
          <p className="text-xs text-risk-high">Self-signed certificate detected. Not issued by a trusted CA.</p>
        </div>
      )}
      <div>
        <Row label="Issuer" value={ssl.issuer} accent={ssl.isSelfSigned} />
        <Row label="Valid From" value={formatDate(ssl.validFrom)} />
        <Row label="Valid To" value={formatDate(ssl.validTo)} accent={ssl.isExpired} />
        <Row
          label="Days Remaining"
          value={ssl.isExpired ? "Expired" : `${ssl.daysRemaining} days`}
          accent={ssl.isExpired || ssl.daysRemaining < 30}
        />
        <Row
          label="Self-Signed"
          value={
            ssl.isSelfSigned ? (
              <span className="text-risk-critical">Yes</span>
            ) : (
              <span className="text-risk-safe">No</span>
            )
          }
        />
      </div>
    </Card>
  );
}

// ─── WHOIS ────────────────────────────────────────────────────────────────────

export function WhoisCard({ scan }: { scan: ScanDetail }) {
  const { whois } = scan;
  const isYoung = whois.domainAgeDays < 30;
  return (
    <Card title="WHOIS / Domain Intelligence" icon={<Globe className="h-4 w-4" />}>
      {isYoung && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-risk-critical/30 bg-risk-critical/8 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-risk-critical shrink-0" />
          <p className="text-xs text-risk-critical">
            Domain is only {whois.domainAgeDays} day{whois.domainAgeDays !== 1 ? "s" : ""} old — highly suspicious.
          </p>
        </div>
      )}
      <div>
        <Row label="Registrar" value={whois.registrar} />
        <Row label="Registered" value={formatDate(whois.registeredAt)} />
        <Row label="Expires" value={formatDate(whois.expiresAt)} />
        <Row label="Domain Age" value={`${whois.domainAgeDays} days`} accent={isYoung} />
        <Row label="Country" value={whois.country} />
        <Row
          label="Privacy Protected"
          value={
            whois.privacyProtected ? (
              <span className="text-risk-medium">Yes (hidden registrant)</span>
            ) : (
              <span className="text-risk-safe">No</span>
            )
          }
        />
      </div>
    </Card>
  );
}

// ─── Reputation Providers ────────────────────────────────────────────────────

const statusMap = {
  clean: { label: "Clean", icon: <CheckCircle2 className="h-4 w-4" />, className: "text-risk-safe" },
  flagged: { label: "Flagged", icon: <XCircle className="h-4 w-4" />, className: "text-risk-critical" },
  unknown: { label: "Unknown", icon: <AlertCircle className="h-4 w-4" />, className: "text-muted-foreground" },
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" />, className: "text-risk-medium" },
};

export function ReputationCard({ scan }: { scan: ScanDetail }) {
  const { reputation } = scan;
  const providers = [
    { name: "Google Safe Browsing", key: reputation.googleSafeBrowsing, live: true },
    { name: "VirusTotal", key: reputation.virusTotal, live: false },
    { name: "PhishTank", key: reputation.phishTank, live: false },
  ] as const;

  return (
    <Card title="Reputation Providers" icon={<ShieldAlert className="h-4 w-4" />}>
      <div className="space-y-2">
        {providers.map((provider) => {
          const status = statusMap[provider.key];
          return (
            <div
              key={provider.name}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className={status.className}>{status.icon}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{provider.name}</p>
                  {!provider.live && (
                    <p className="text-[10px] text-muted-foreground">Future-ready integration</p>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  status.className
                )}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Confidence Analysis ──────────────────────────────────────────────────────

export function ConfidenceAnalysisCard({ scan }: { scan: ScanDetail }) {
  return (
    <Card title="Confidence Analysis" icon={<Activity className="h-4 w-4" />}>
      <div className="space-y-4">
        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground">Model Confidence</p>
            <p className="text-sm font-semibold text-primary">{scan.confidence}%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${scan.confidence}%` }}
            />
          </div>
        </div>

        {/* Legitimacy */}
        {scan.confidenceFactors.legitimacy.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-risk-safe">
              Legitimacy Indicators
            </p>
            <ul className="space-y-1">
              {scan.confidenceFactors.legitimacy.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-risk-safe mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uncertainty */}
        {scan.confidenceFactors.uncertainty.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-risk-medium">
              Uncertainty Factors
            </p>
            <ul className="space-y-1">
              {scan.confidenceFactors.uncertainty.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-risk-medium mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
