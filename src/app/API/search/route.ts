import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=0&listsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } }
    )
    const data = await res.json()

    const results = (data.quotes || [])
      .filter((q: { quoteType: string }) => q.quoteType === 'EQUITY')
      .slice(0, 6)
      .map((q: { symbol: string; longname?: string; shortname?: string; exchDisp?: string }) => ({
        ticker:   q.symbol,
        name:     q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || '',
        country:
          q.exchDisp?.includes('Paris')     ? 'France'      :
          q.exchDisp?.includes('Frankfurt') ? 'Allemagne'   :
          q.exchDisp?.includes('Milan')     ? 'Italie'      :
          q.exchDisp?.includes('Madrid')    ? 'Espagne'     :
          q.exchDisp?.includes('NYSE') || q.exchDisp?.includes('NASDAQ') ? 'États-Unis' :
          q.exchDisp?.includes('London')    ? 'Royaume-Uni' : 'Autre',
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
