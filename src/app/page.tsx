"use client";

import { useState } from "react";
import {
  TrendingUp, TrendingDown, Home, Shield, FlaskConical,
  Mail, Settings, Bell, Plus, ChevronRight, User, Wallet,
  LayoutGrid, Calendar, BarChart3
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Position {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  color: string;
}

// ─── Données de démonstration ─────────────────────────────────────────────────

const POSITIONS: Position[] = [
  { id: 1, ticker: "MC.PA",  name: "LVMH",          sector: "Luxe",      quantity: 3,  buyPrice: 650, currentPrice: 720, color: "#7F77DD" },
  { id: 2, ticker: "TTE.PA", name: "TotalEnergies",  sector: "Énergie",   quantity: 10, buyPrice: 58,  currentPrice: 62,  color: "#1D9E75" },
  { id: 3, ticker: "AIR.PA", name: "Airbus",         sector: "Industrie", quantity: 5,  buyPrice: 130, currentPrice: 155, color: "#378ADD" },
  { id: 4, ticker: "SAN.PA", name: "Sanofi",         sector: "Santé",     quantity: 8,  buyPrice: 88,  currentPrice: 85,  color: "#E24B4A" },
  { id: 5, ticker: "BNP.PA", name: "BNP Paribas",    sector: "Finance",   quantity: 12, buyPrice: 52,  currentPrice: 58,  color: "#EF9F27" },
];

const CHART_DATA = [
  { date: "Jan 23", value: 14200 },
  { date: "Avr 23", value: 14800 },
  { date: "Juil 23", value: 15100 },
  { date: "Oct 23", value: 14600 },
  { date: "Jan 24", value: 15900 },
  { date: "Avr 24", value: 16400 },
  { date: "Juil 24", value: 16100 },
  { date: "Oct 24", value: 17200 },
  { date: "Jan 25", value: 17800 },
  { date: "Mai 26", value: 18450 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  // Calculs du portefeuille
  const totalValue = POSITIONS.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const totalCost  = POSITIONS.reduce((s, p) => s + p.quantity * p.buyPrice, 0);
  const pnl        = totalValue - totalCost;
  const pnlPct     = (pnl / totalCost) * 100;

  const navItems = [
    { icon: <Home size={18} />,         label: "Dashboard",   id: "dashboard"   },
    { icon: <Shield size={18} />,       label: "Analyse",     id: "analyse"     },
    { icon: <FlaskConical size={18} />, label: "Simulateur",  id: "simulateur"  },
    { icon: <Mail size={18} />,         label: "Newsletter",  id: "newsletter"  },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-14 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 items-center py-4 gap-2 fixed h-full z-10">
        {/* Logo */}
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center mb-3 flex-shrink-0">
          <span className="text-white text-[11px] font-bold tracking-tight">FT</span>
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            title={item.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeNav === item.id
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {item.icon}
          </button>
        ))}

        <div className="flex-1" />

        <button title="Réglages" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Settings size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-medium cursor-pointer">
          J
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 md:ml-14 p-4 pb-24 md:pb-6 w-full">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 mt-2">
          <div>
            <h1 className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
              Bonjour Jérémy 👋
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Mis à jour il y a 2 min</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 px-3">
              <Plus size={13} /> Ajouter
            </Button>
            <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Bell size={15} />
            </button>
          </div>
        </div>

        {/* ── Hero card ── */}
        <Card className="bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50 p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-2">
                Valeur totale du portefeuille
              </p>
              <p className="text-[32px] font-medium text-violet-900 dark:text-violet-100 leading-none mb-3">
                {fmt(totalValue)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[11px] gap-1 px-2 py-0.5">
                  <TrendingUp size={10} /> {fmtPct(pnlPct)}
                </Badge>
                <span className="text-[11px] text-violet-400">
                  {fmt(pnl)} depuis le début
                </span>
              </div>
              <p className="text-[11px] text-violet-400/70 mt-1.5">
                {POSITIONS.length} positions · Coût d&apos;achat {fmt(totalCost)}
              </p>
            </div>

            {/* Sparkline */}
            <div className="flex-shrink-0 w-36 md:w-44">
              <ResponsiveContainer width="100%" height={54}>
                <AreaChart data={CHART_DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#7F77DD" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7F77DD" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: "0.5px solid #e5e7eb", padding: "4px 8px" }}
                    formatter={(v: number) => [fmt(v), "Valeur"]}
                    labelStyle={{ fontSize: 10, color: "#9ca3af" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7F77DD"
                    strokeWidth={2}
                    fill="url(#chartGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#7F77DD" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[10px] text-violet-400">Jan. 2023</span>
                <span className="text-[10px] text-violet-400">Mai 2026</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Métriques ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {/* Fixe 1 — Plus-value */}
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1">
              <Wallet size={11} /> Plus-value
            </p>
            <p className="text-[17px] font-medium text-emerald-600 dark:text-emerald-500">
              {fmt(pnl)}
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">Gain latent total</p>
          </Card>

          {/* Fixe 2 — Positions */}
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1">
              <LayoutGrid size={11} /> Positions
            </p>
            <p className="text-[17px] font-medium text-gray-900 dark:text-gray-100">
              {POSITIONS.length} lignes
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">Coût : {fmt(totalCost)}</p>
          </Card>

          {/* Choix 1 — Performance du jour */}
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1">
              <Calendar size={11} /> Perf. du jour
            </p>
            <p className="text-[17px] font-medium text-emerald-600 dark:text-emerald-500">
              +127 €
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">+0,7% aujourd&apos;hui</p>
          </Card>

          {/* Choix 2 — Performance du mois */}
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1">
              <BarChart3 size={11} /> Perf. ce mois
            </p>
            <p className="text-[17px] font-medium text-emerald-600 dark:text-emerald-500">
              +3,2%
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">+540 € en mai 2026</p>
          </Card>
        </div>

        {/* ── Tableau des positions ── */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Mes positions</h2>
            <button className="text-[11px] text-violet-500 flex items-center gap-0.5 hover:text-violet-700 transition-colors">
              Voir tout <ChevronRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-[11px] font-normal text-gray-400 pb-2 px-1">Titre</th>
                  <th className="text-left text-[11px] font-normal text-gray-400 pb-2 px-1 hidden md:table-cell">Secteur</th>
                  <th className="text-right text-[11px] font-normal text-gray-400 pb-2 px-1">Valeur</th>
                  <th className="text-right text-[11px] font-normal text-gray-400 pb-2 px-1">PnL %</th>
                </tr>
              </thead>
              <tbody>
                {POSITIONS.map((p) => {
                  const val     = p.quantity * p.currentPrice;
                  const linePct = ((p.currentPrice - p.buyPrice) / p.buyPrice) * 100;
                  const isPos   = linePct >= 0;

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 dark:border-gray-800/40 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: p.color }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-[13px] leading-none">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{p.ticker}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-1 text-[12px] text-gray-400 hidden md:table-cell">
                        {p.sector}
                      </td>
                      <td className="py-3 px-1 text-right text-[13px] font-medium text-gray-900 dark:text-gray-100">
                        {fmt(val)}
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          isPos
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                        }`}>
                          {isPos ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                          {fmtPct(linePct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* ── Navigation mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around py-2 z-10">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              activeNav === item.id ? "text-violet-600" : "text-gray-400"
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
        <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <User size={18} />
          <span className="text-[10px]">Profil</span>
        </button>
      </nav>
    </div>
  );
}
