const API_URL = 'https://api.anthropic.com/v1/messages'

export async function analyzeWithClaude(apiKey, prices) {
  const lines = Object.entries(prices)
    .filter(([, d]) => d !== null)
    .map(([name, d]) =>
      `${name}: ${d.current.toFixed(4)} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}% günlük)`
    )
    .join('\n')

  const prompt = `Sen deneyimli bir Türk finansal analistisin. Aşağıdaki güncel piyasa verilerini analiz et.

Veriler (${new Date().toLocaleDateString('tr-TR')}):
${lines}

Türk yatırımcısının bakış açısıyla — enflasyon, TL değer kaybı ve kısa vadeli momentum göz önünde bulundurarak — her enstrüman için sinyal ver.

Yanıtını YALNIZCA şu JSON formatında ver, başka hiçbir şey yazma:
{
  "sinyaller": {
    "Gram Altın": "firsat",
    "Dolar/TL": "bekle",
    "Euro/TL": "bekle",
    "BIST 100": "dikkat"
  },
  "ozet": "Kısa 2-3 cümle Türkçe yorum."
}

Geçerli sinyal değerleri: "firsat", "bekle", "dikkat"`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Claude API hatası: ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''

  // JSON'u metin içinden çıkar (model bazen fazladan karakter ekler)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude geçersiz yanıt döndürdü')
  return JSON.parse(match[0])
}
