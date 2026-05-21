"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, RefreshCw, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  ticker:   string
  name:     string
  exchange: string
  country:  string
}

interface AddPositionModalProps {
  onClose:  () => void
  onSaved:  () => void
}

const SECTORS = ["Luxe","Énergie","Finance","Technologie","Santé","Industrie",
                 "Immobilier","Consommation","Télécom","Matériaux","Autre"]

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%"

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AddPositionModal({ onClose, onSaved }: AddPositionModalProps) {
  const [query,       setQuery]       = useState("")
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [showSug,     setShowSug]     = useState(false)
  const [selected,    setSelected]    = useState<SearchResult | null>(null)
  const [sector,      setSector]      = useState("Autre")
  const [qty,         setQty]         = useState("")
  const [buyPrice,    setBuyPrice]    = useState("")
  const [buyDate,     setBuyDate]     = useState("")
  const [curPrice,    setCurPrice]    = useState<number | null>(null)
  const [fetchStatus, setFetchStatus] = useState<"idle"|"loading"|"ok"|"error">("idle")
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState("")

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  // Fermer les suggestions en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSug(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Autocomplétion avec debounce
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (query.length < 2) { setSuggestions([]); setShowSug(false); return }

    searchRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data)
        setShowSug(data.length > 0)
      } catch { setSuggestions([]) }
    }, 300)
  }, [query])

  // Récupération du prix quand on sélectionne un ticker
  const selectTicker = async (result: SearchResult) => {
    setSelected(result)
    setSector(
      result.name.toLowerCase().includes("total") ? "Énergie" :
      result.name.toLowerCase().includes("bnp") || result.name.toLowerCase().includes("socié") ? "Finance" :
      result.name.toLowerCase().includes("sanofi") || result.name.toLowerCase().includes("astra") ? "Santé" :
      result.name.toLowerCase().includes("airbus") || result.name.toLowerCase().includes("safran") ? "Industrie" :
      result.name.toLowerCase().includes("lvmh") || result.name.toLowerCase().includes("hermès") ? "Luxe" : "Autre"
    )
    setQuery(result.name)
    setShowSug(false)
    setFetchStatus("loading")
    setCurPrice(null)

    try {
      const res  = await fetch(`/api/quote?ticker=${result.ticker}`)
      const data = await res.json()
      if (data.price) { setCurPrice(data.price); setFetchStatus("ok") }
      else { setFetchStatus("error") }
    } catch { setFetchStatus("error") }
  }

  // Calculs de preview
  const qtyNum     = parseFloat(qty)     || 0
  const buyNum     = parseFloat(buyPrice) || 0
  const totalCost  = qtyNum * buyNum
  const totalVal   = qtyNum * (curPrice || buyNum)
  const pnl        = totalVal - totalCost
  const pnlPct     = buyNum > 0 ? ((curPrice || buyNum) - buyNum) / buyNum * 100 : 0
  const isReady    = selected && qtyNum > 0 && buyNum > 0 && curPrice !== null

  // Sauvegarde dans Supabase
  const handleSave = async () => {
    if (!selected || !isReady) return
    setSaving(true)
    setSaveError("")

    const { error } = await supabase.from("positions").insert({
      ticker:        selected.ticker,
      name:          selected.name,
      sector:        sector,
      country:       selected.country,
      quantity:      qtyNum,
      buy_price:     buyNum,
      current_price: curPrice,
    })

    if (error) {
      setSaveError("Erreur lors de la sauvegarde. Réessaie.")
      setSaving(false)
    } else {
      onSaved()
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem"
    }}>
      <Card style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#EEEDFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} color="#534AB7" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Nouvelle position</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color="var(--color-text-secondary, #888)" />
          </button>
        </div>

        {/* Recherche ticker */}
        <div style={{ marginBottom: 16 }} ref={wrapRef}>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary, #888)", marginBottom: 5 }}>
            Rechercher une action
          </p>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input
              placeholder="Ticker ou nom (ex: LVMH, MC.PA…)"
              value={query}
              onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              style={{ paddingLeft: 32, fontSize: 13, width: "100%", padding: "8px 10px 8px 32px", borderRadius: 6, border: "0.5px solid #ddd", fontFamily: "inherit" }}
            />
            {showSug && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-background-primary, white)", border: "0.5px solid #e5e5e5", borderRadius: 8, marginTop: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                {suggestions.map(s => (
                  <div key={s.ticker} onClick={() => selectTicker(s)}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid #f5f5f5" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8f8f8")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#EEEDFE", color: "#534AB7", fontWeight: 500, flexShrink: 0 }}>
                      {s.ticker}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      <p style={{ fontSize: 11, color: "#999" }}>{s.exchange} · {s.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Champs auto-remplis */}
        {selected && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Société</p>
              <input value={selected.name} readOnly style={{ fontSize: 13, width: "100%", background: "#f8f8f8", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd" }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Secteur</p>
              <select value={sector} onChange={e => setSector(e.target.value)} style={{ fontSize: 13, width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd", fontFamily: "inherit" }}>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ borderTop: "0.5px solid #f0f0f0", margin: "0 0 16px" }} />
        <p style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12, fontWeight: 500 }}>
          Mon achat
        </p>

        {/* Quantité + Prix achat + Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Quantité</p>
            <input type="number" min="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} style={{ fontSize: 13, width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Prix d'achat (€)</p>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} style={{ fontSize: 13, width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Date d'achat</p>
            <input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} style={{ fontSize: 13, width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd" }} />
          </div>
        </div>

        {/* Prix actuel */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Prix actuel (€) — récupéré automatiquement</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={curPrice !== null ? curPrice.toFixed(2) : ""} placeholder={fetchStatus === "loading" ? "Récupération…" : "—"}
              style={{ fontSize: 13, flex: 1, padding: "8px 10px", borderRadius: 6, border: "0.5px solid #ddd", background: "#f8f8f8" }} />
            {fetchStatus === "loading" && <RefreshCw size={15} color="#aaa" style={{ animation: "spin 1s linear infinite" }} />}
            {fetchStatus === "ok"      && <CheckCircle size={15} color="#16a34a" />}
            {fetchStatus === "error"   && (
              <button onClick={() => selected && selectTicker(selected)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4 }}>
                Réessayer
              </button>
            )}
          </div>
          {fetchStatus === "ok" && (
            <p style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>✓ Prix récupéré via Yahoo Finance</p>
          )}
        </div>

        {/* Preview */}
        {isReady && (
          <div style={{ background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "#534AB7", fontWeight: 500, marginBottom: 8 }}>Aperçu de la position</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#26215C" }}>
                  {selected?.name.split(" ")[0]} · {qtyNum} titre{qtyNum > 1 ? "s" : ""}
                </p>
                <p style={{ fontSize: 12, color: "#534AB7", marginTop: 2 }}>
                  Coût : {fmt(totalCost)} · Valeur : {fmt(totalVal)}
                </p>
              </div>
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
                background: pnl >= 0 ? "#E1F5EE" : "#FCEBEB",
                color:      pnl >= 0 ? "#085041" : "#791F1F"
              }}>
                {fmtPct(pnlPct)}
              </span>
            </div>
          </div>
        )}

        {saveError && (
          <div style={{ background: "#FCEBEB", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <AlertCircle size={14} color="#A32D2D" />
            <p style={{ fontSize: 13, color: "#A32D2D" }}>{saveError}</p>
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={handleSave} disabled={!isReady || saving}
            style={{ flex: 1, fontSize: 13, fontWeight: 500, background: isReady ? "#111" : undefined, color: isReady ? "#fff" : undefined, border: "none", opacity: isReady ? 1 : 0.4 }}>
            {saving ? "Enregistrement…" : "Ajouter la position"}
          </Button>
          <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>
            Annuler
          </Button>
        </div>
      </Card>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
