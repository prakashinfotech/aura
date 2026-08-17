"use client";

import * as React from "react";
import {
  Download, Clock, CheckCircle2, AlertCircle, Loader2,
  Banknote, Building2, ArrowDownToLine, X, ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatInr } from "@aura/ui/price-display";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettlementStatus = "paid" | "processing" | "pending" | "failed";

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  commission: number;
  tds: number;
  net_amount: number;
  status: SettlementStatus;
  razorpay_payout_id: string | null;
  paid_at: string | null;
}

interface AvailableBalance {
  available_gross: number;
  available_net: number;
  commission_amount: number;
  tds_amount: number;
  eligible_items: number;
  commission_rate: number;
}

interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SettlementStatus, { label: string; icon: React.ElementType; cls: string }> = {
  paid:       { label: "Paid",       icon: CheckCircle2, cls: "text-[var(--success)] bg-[var(--success-soft)]" },
  processing: { label: "Processing", icon: Clock,        cls: "text-[var(--info)] bg-[var(--info-soft)]" },
  pending:    { label: "Pending",    icon: Clock,        cls: "text-[var(--warning)] bg-[var(--warning-soft)]" },
  failed:     { label: "Failed",     icon: AlertCircle,  cls: "text-[var(--error)] bg-[var(--error-soft)]" },
};

const COMMISSION_RATES = [
  { category: "Men's Clothing",  rate: "15%" },
  { category: "Women's Clothing",rate: "15%" },
  { category: "Kids",            rate: "12%" },
  { category: "Footwear",        rate: "18%" },
  { category: "Beauty",          rate: "20%" },
  { category: "Home & Living",   rate: "10%" },
  { category: "Sports & Studio", rate: "15%" },
];

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const maskAccount = (n: string) =>
  n.length > 4 ? "•".repeat(n.length - 4) + n.slice(-4) : n;

// ── Withdraw confirmation modal ────────────────────────────────────────────────

function WithdrawModal({
  balance,
  bank,
  onConfirm,
  onClose,
  loading,
}: {
  balance: AvailableBalance;
  bank: BankDetails;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ArrowDownToLine size={18} className="text-[var(--brand)]" />
            <span className="font-bold text-[var(--foreground)]">Withdraw to Bank</span>
          </div>
          <button onClick={onClose} disabled={loading}
            className="rounded-full p-1 hover:bg-[var(--background)] disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Amount breakdown */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">Gross amount</span>
              <span className="font-semibold text-[var(--foreground)]">{formatInr(balance.available_gross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">Commission ({balance.commission_rate}%)</span>
              <span className="text-[var(--error)]">− {formatInr(balance.commission_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">TDS (1% per §194O)</span>
              <span className="text-[var(--error)]">− {formatInr(balance.tds_amount)}</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between">
              <span className="font-bold text-[var(--foreground)]">You receive</span>
              <span className="text-lg font-bold text-[var(--success)]">{formatInr(balance.available_net)}</span>
            </div>
          </div>

          {/* Bank account */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 flex items-center gap-3">
            <Building2 size={18} className="shrink-0 text-[var(--foreground-muted)]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{bank.accountHolder}</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {bank.bankName} · {maskAccount(bank.accountNumber)} · {bank.ifsc}
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex gap-2 rounded-[var(--radius-md)] bg-[var(--info-soft)] px-3 py-2.5">
            <Info size={14} className="mt-0.5 shrink-0 text-[var(--info)]" />
            <p className="text-xs text-[var(--info)]">
              Settlement will be processed within 2–3 business days. You will be notified once funds are credited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[var(--border)] px-5 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownToLine size={15} />}
            {loading ? "Processing…" : "Confirm Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SettlementsPage() {
  const [tab, setTab]             = React.useState<"history" | "commission">("history");
  const [history, setHistory]     = React.useState<Settlement[]>([]);
  const [balance, setBalance]     = React.useState<AvailableBalance | null>(null);
  const [bank, setBank]           = React.useState<BankDetails | null>(null);
  const [loading, setLoading]     = React.useState(true);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [sellerId, setSellerId]   = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seller } = await (supabase as any)
      .from("sellers")
      .select("id, bank_details")
      .eq("user_id", session.user.id)
      .single();

    if (!seller) { setLoading(false); return; }

    setSellerId(seller.id);
    if (seller.bank_details) setBank(seller.bank_details as BankDetails);

    const [histResult, balResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("settlements")
        .select("*")
        .eq("seller_id", seller.id)
        .order("period_start", { ascending: false })
        .limit(30),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("get_seller_available_balance", { p_seller_id: seller.id }),
    ]);

    if (histResult.error) console.error("[settlements] history:", histResult.error);
    if (balResult.error)  console.error("[settlements] balance RPC:", balResult.error);

    setHistory((histResult.data ?? []) as Settlement[]);
    const balRows = balResult.data;
    if (balRows && balRows.length > 0) setBalance(balRows[0] as AvailableBalance);

    setLoading(false);
  }

  React.useEffect(() => { void load(); }, []);

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/settlements/request", { method: "POST" });
      const json = await res.json() as { error?: string; netAmount?: number };
      if (!res.ok) {
        toast.error(json.error ?? "Withdrawal failed");
        return;
      }
      toast.success(`Withdrawal of ${formatInr(json.netAmount ?? 0)} initiated!`);
      setShowModal(false);
      await load(); // refresh balance + history
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setWithdrawing(false);
    }
  }

  const totalPaid  = history.filter((s) => s.status === "paid").reduce((a, s) => a + Number(s.net_amount), 0);
  const inProgress = history.find((s) => s.status === "processing" || s.status === "pending");
  const canWithdraw = !loading && balance && balance.available_net >= 500 && !!bank?.accountNumber;

  return (
    <>
      {showModal && balance && bank && (
        <WithdrawModal
          balance={balance}
          bank={bank}
          onConfirm={handleWithdraw}
          onClose={() => setShowModal(false)}
          loading={withdrawing}
        />
      )}

      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Settlements</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Track payouts and withdraw earned amount to bank</p>
          </div>
          <button className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]">
            <Download size={15} /> Export XLSX
          </button>
        </div>

        {/* ── Available balance + withdraw ── */}
        <div className="mb-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-soft)] to-[var(--surface)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Banknote size={20} className="text-[var(--brand)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Available to Withdraw
                </p>
                {loading ? (
                  <div className="mt-1 h-8 w-32 animate-pulse rounded bg-[var(--border)]" />
                ) : (
                  <p className="mt-0.5 text-3xl font-bold text-[var(--foreground)]">
                    {balance ? formatInr(balance.available_net) : "₹0"}
                  </p>
                )}
                {balance && balance.eligible_items > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    From {balance.eligible_items} fulfilled order{balance.eligible_items !== 1 ? "s" : ""} ·{" "}
                    Gross {formatInr(balance.available_gross)}
                  </p>
                )}
                {balance && balance.available_net > 0 && balance.available_net < 500 && (
                  <p className="mt-1 text-xs text-[var(--warning)]">
                    Minimum withdrawal is ₹500 — need {formatInr(500 - balance.available_net)} more
                  </p>
                )}
                {!loading && (!balance || balance.eligible_items === 0) && (
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    No fulfilled orders pending settlement
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <button
                onClick={() => setShowModal(true)}
                disabled={!canWithdraw}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine size={16} />
                Withdraw to Bank
              </button>
              {!bank?.accountNumber && !loading && (
                <p className="flex items-center gap-1 text-[11px] text-[var(--warning)]">
                  <AlertCircle size={11} />
                  Add bank account in{" "}
                  <a href="/dashboard/settings" className="underline font-semibold">Settings</a>{" "}
                  first
                </p>
              )}
            </div>
          </div>

          {/* Bank account preview strip */}
          {bank?.accountNumber && (
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/60 px-4 py-2.5">
              <Building2 size={15} className="shrink-0 text-[var(--foreground-muted)]" />
              <span className="text-xs text-[var(--foreground-muted)]">To:</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{bank.bankName}</span>
              <span className="text-xs text-[var(--foreground-muted)]">· {maskAccount(bank.accountNumber)}</span>
              <span className="ml-auto flex items-center gap-0.5 text-[11px] text-[var(--foreground-muted)] hover:text-[var(--brand)]">
                <a href="/dashboard/settings?tab=bank" className="underline">Change</a>
                <ChevronRight size={11} />
              </span>
            </div>
          )}
        </div>

        {/* ── Summary cards ── */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Paid Out",
              value: formatInr(totalPaid),
              sub: "All time",
            },
            {
              label: "Next Settlement",
              value: inProgress ? formatInr(inProgress.net_amount) : "—",
              sub: inProgress ? "In progress" : "No pending",
            },
            {
              label: "Cycle",
              value: "D+15",
              sub: "Mon / Wed / Fri",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--foreground-muted)]">{c.label}</p>
              <p className="mt-1.5 text-xl font-bold text-[var(--foreground)]">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
          {(["history", "commission"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t === "history" ? "Settlement History" : "Commission Rates"}
            </button>
          ))}
        </div>

        {/* ── History table ── */}
        {tab === "history" && (
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={20} className="animate-spin text-[var(--brand)]" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center">
                <Banknote size={32} className="mx-auto text-[var(--foreground-muted)]" strokeWidth={1.5} />
                <p className="mt-3 font-semibold text-[var(--foreground)]">No settlements yet</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Complete and ship orders to earn your first settlement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      {["Period", "Gross", "Commission", "TDS (1%)", "Net Payout", "Status", "UTR / Date"].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s) => {
                      const cfg  = STATUS_CFG[s.status] ?? STATUS_CFG.pending;
                      const Icon = cfg.icon;
                      return (
                        <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--foreground)]">
                            {fmt(s.period_start)} – {fmt(s.period_end)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                            {formatInr(s.gross_amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--error)]">
                            − {formatInr(s.commission)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--error)]">
                            − {formatInr(s.tds)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--foreground)]">
                            {formatInr(s.net_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
                              <Icon size={11} />{cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">
                            {s.razorpay_payout_id ? (
                              <span className="font-mono">{s.razorpay_payout_id.slice(0, 16)}…</span>
                            ) : s.paid_at ? fmt(s.paid_at) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Commission rates ── */}
        {tab === "commission" && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-5 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">Commission by Category</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Platform fee deducted before settlement. TDS 1% per Income Tax Act §194O.
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                      Category
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMMISSION_RATES.map((r) => (
                    <tr key={r.category} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
                      <td className="px-5 py-3 text-sm text-[var(--foreground)]">{r.category}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-[var(--brand)]">{r.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-1 text-xs text-[var(--foreground-muted)]">
              Settlement cycle: D+15, processed Mon/Wed/Fri. Minimum payout ₹500. Failed payouts auto-retry after 24h.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
