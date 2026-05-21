"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, TrendingDown, Home, Shield, FlaskConical,
  Mail, Settings, Bell, Plus, ChevronRight, User,
  Wallet, LayoutGrid, Calendar, BarChart3, RefreshCw
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { supabase } from "@/lib/supabase"
import AddPositionModal from "@/components/AddPositionModal"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Position {
  id:            string
  ticker:        string
  name:          string
  sector:        string
  country:       string
  quantity:      number
  buy_price:     number
  current_price: number
  color?:        string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = ["#7F77DD","#1D9E75","#378ADD","#D85A30","#D4537E","#639922","#BA7517","#888780","#E24B4A","#5DCAA5","#EF9F27"]

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%"

const CHART_DATA = [
  { date: "Jan 23", value: 14200 }, { date: "Avr 23", value: 14800 },
  { date: "Juil 23", value: 15100 }, { date: "Oct 23", value: 14600 },
  { date: "Jan 24", value: 15900 }, { date: "Avr 24", value: 16400 },
  { date: "Juil 24", value: 16100 }, { date: "Oct 24", value: 17200 },
  { date: "Jan 25", value: 17800 }, { date: "Mai 26", value: 18450 },
]

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeNav,    setActiveNav]    = useState("dashboard")
  const [positions,    setPositions]    = useState<Position[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [refreshing,   setRefreshing]   = useState(false)

  // Charger les positions depuis Supabase
  const loadPositions = useCallback(async () => {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPositions(data.map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] })))
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { loadPositions() }, [loadPositions])

  // Rafraîchir les prix via Yahoo Finance
  const refreshPrices = async () => {
    setRefreshing(true)
    for (const pos of positions) {
      try {
        const res  = await fetch(`/api/quote?ticker=${pos.ticker}`)
        const data = await res.json()
        if (data.price) {
          await supabase.from("positions").update({ current_price: data.price }).eq("id", pos.id)
        }
      } catch { /* ignore */ }
    }
    await loadPositions()
  }

  // ─── Calculs ───────────────────────────────────────────────────────────────

  const tv     = positions.reduce((s, p) => s + p.quantity * p.current_price, 0)
  const tc     = positions.reduce((s, p) => s + p.quantity * p.buy_price, 0)
  const pnl    = tv - tc
  const pnlPct = tc > 0 ? (pnl / tc) * 100 : 0
  const topH   = [...positions].sort((a, b) => b.quantity * b.current_price - a.quantity * a.current_price)[0]

  // Mise à jour du graphique avec la vraie valeur totale
  const chartData = [...CHART_DATA.slice(0, -1), { date: "Aujourd'hui", value: Math.round(tv) }]

  // ─── Navigation ────────────────────────────────────────────────────────────

  const navItems = [
    { icon: <Home size={18} />,         label: "Dashboard",  id: "dashboard"  },
    { icon: <Shield size={18} />,       label: "Analyse",    id: "analyse"    },
    { icon: <FlaskConical size={18} />, label: "Simulateur", id: "simulateur" },
    { icon: <Mail size={18} />,         label: "Newsletter", id: "newsletter" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-14 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 items-center py-4 gap-2 fixed h-full z-10">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center mb-3">
          <span className="text-white text-[11px] font-bold tracking-tight">FT</span>
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveNav(item.id)} title={item.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeNav === item.id
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}>
            {item.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button title="Réglages" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
          <Settings size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium cursor-pointer">J</div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 md:ml-14 p-4 pb-24 md:pb-6 w-full">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 mt-2">
          <div>
            <h1 className="text-[15px] font-medium text-gray-900 dark:text-gray-100">Bonjour Jérémy 👋</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {positions.length} position{positions.length > 1 ? "s" : ""} · mis à jour maintenant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshPrices} disabled={refreshing}
              className="h-8 text-xs gap-1 px-3">
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "…" : "Actualiser"}
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="h-8 text-xs gap-1 px-3 bg-violet-600 hover:bg-violet-700 text-white border-none">
              <Plus size={13} /> Ajouter
            </Button>
            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Bell size={15} />
            </button>
          </div>
        </div>

        {/* ── Hero card ── */}
        <Card className="bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50 p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-violet-500 uppercase tracking-widest mb-2">Valeur totale du portefeuille</p>
              <p className="text-[32px] font-medium text-violet-900 dark:text-violet-100 leading-none mb-3">
                {loading ? "—" : fmt(tv)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[11px] gap-1 px-2 py-0.5 ${pnl >= 0 ? "bg-emerald-500 hover:bg-emerald-500" : "bg-red-500 hover:bg-red-500"} text-white`}>
                  {pnl >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {fmtPct(pnlPct)}
                </Badge>
                <span className="text-[11px] text-violet-400">{fmt(pnl)} depuis le début</span>
              </div>
              <p className="text-[11px] text-violet-400/70 mt-1.5">
                {positions.length} positions · Coût d&apos;achat {fmt(tc)}
              </p>
            </div>
            <div className="flex-shrink-0 w-36 md:w-44">
              <ResponsiveContainer width="100%" height={54}>
                <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#7F77DD" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7F77DD" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "0.5px solid #e5e7eb", padding: "4px 8px" }}
                    formatter={(v: number) => [fmt(Number(v)), "Valeur"]}
                    labelStyle={{ fontSize: 10, color: "#9ca3af" }} />
                  <Area type="monotone" dataKey="value" stroke="#7F77DD" strokeWidth={2} fill="url(#chartGrad)" dot={false} activeDot={{ r: 3, fill: "#7F77DD" }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[10px] text-violet-400">Jan. 2023</span>
                <span className="text-[10px] text-violet-400">Aujourd&apos;hui</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Métriques ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1"><Wallet size={11} /> Plus-value</p>
            <p className={`text-[17px] font-medium ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(pnl)}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Gain latent total</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1"><LayoutGrid size={11} /> Positions</p>
            <p className="text-[17px] font-medium text-gray-900 dark:text-gray-100">{positions.length} ligne{positions.length > 1 ? "s" : ""}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Coût : {fmt(tc)}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1"><Calendar size={11} /> Perf. du jour</p>
            <p className="text-[17px] font-medium text-emerald-600">+127 €</p>
            <p className="text-[10px] text-gray-300 mt-0.5">+0,7% aujourd&apos;hui</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] text-gray-400 mb-1.5 flex items-center gap-1"><BarChart3 size={11} /> Perf. ce mois</p>
            <p className="text-[17px] font-medium text-emerald-600">+3,2%</p>
            <p className="text-[10px] text-gray-300 mt-0.5">+540 € en mai 2026</p>
          </Card>
        </div>

        {/* ── Tableau des positions ── */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Mes positions</h2>
            <button className="text-[11px] text-violet-500 flex items-center gap-0.5 hover:text-violet-700">
              Voir tout <ChevronRight size={13} />
            </button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-sm text-gray-400">Chargement…</p>
          ) : positions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400 mb-3">Aucune position pour l&apos;instant</p>
              <Button size="sm" onClick={() => setShowModal(true)} className="bg-violet-600 hover:bg-violet-700 text-white border-none text-xs gap-1">
                <Plus size={13} /> Ajouter ma première position
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Titre","Secteur","Qté","Px achat","Valeur","PnL %"].map((h, i) => (
                      <th key={h} className={`text-[11px] font-normal text-gray-400 pb-2 px-1 ${i > 1 ? "text-right" : "text-left"} ${i === 1 ? "hidden md:table-cell" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const val     = p.quantity * p.current_price
                    const linePct = ((p.current_price - p.buy_price) / p.buy_price) * 100
                    const isPos   = linePct >= 0
                    return (
                      <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/40 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-[13px] leading-none">{p.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{p.ticker}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-1 text-[12px] text-gray-400 hidden md:table-cell">{p.sector}</td>
                        <td className="py-3 px-1 text-right text-[12px]">{p.quantity}</td>
                        <td className="py-3 px-1 text-right text-[12px]">{p.buy_price.toFixed(2)}€</td>
                        <td className="py-3 px-1 text-right text-[13px] font-medium text-gray-900 dark:text-gray-100">{fmt(val)}</td>
                        <td className="py-3 px-1 text-right">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isPos ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {isPos ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                            {fmtPct(linePct)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* ── Navigation mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 flex items-center justify-around py-2 z-10">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 ${activeNav === item.id ? "text-violet-600" : "text-gray-400"}`}>
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
        <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <User size={18} />
          <span className="text-[10px]">Profil</span>
        </button>
      </nav>

      {/* ── Modal ajout de position ── */}
      {showModal && (
        <AddPositionModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadPositions() }}
        />
      )}
    </div>
  )
}
