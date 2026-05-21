import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker requis' }, { status: 400 })
  }

  try {
    const res  = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await res.json()
    const meta          = data?.chart?.result?.[0]?.meta
    const price         = meta?.regularMarketPrice
    const previousClose = meta?.previousClose

    if (!price) {
      return NextResponse.json({ error: 'Prix introuvable' }, { status: 404 })
    }

    return NextResponse.json({ price, previousClose })
  } catch {
    return NextResponse.json({ error: 'Erreur Yahoo Finance' }, { status: 500 })
  }
}