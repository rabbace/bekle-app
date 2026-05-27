const API_URL = 'https://api.anthropic.com/v1/messages'

async function callClaude(apiKey, prompt, maxTokens = 300) {
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
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Claude API hatası: ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

export async function commentOnStock(apiKey, { symbol, companyName, overall, verdict, pros, cons, dims }) {
  const dimLines = dims
    .filter(d => d.score != null)
    .map(d => `  ${d.name}: ${d.score}/100`)
    .join('\n')

  const prosText = pros.length ? pros.slice(0, 3).join('; ') : 'yok'
  const consText = cons.length ? cons.slice(0, 3).join('; ') : 'yok'

  const prompt = `Sen deneyimli bir Türk hisse analisti ve portföy yöneticisisin.

Kural tabanlı motor şu sonucu üretti:
Şirket: ${companyName || symbol} (${symbol})
Genel Skor: ${overall ?? '?'}/100 → ${verdict?.label ?? '?'}

Boyut Skorları:
${dimLines}

Güçlü yönler: ${prosText}
Zayıf yönler: ${consText}

Görev: Bu sonucu Türk yatırımcısının bakış açısından, sade ve net bir dille 2-3 cümle yorumla. Teknik jargon kullanma, doğrudan bir görüş bildir. Yatırım tavsiyesi olmadığını belirtme.`

  return callClaude(apiKey, prompt, 250)
}

export async function analyzeWithClaude(apiKey, prices) {
  const available = Object.entries(prices).filter(([, d]) => d !== null)
  const lines = available.map(([name, d]) => `${name}: ${d.current.toFixed(4)}`).join('\n')
  const signalKeys = available.map(([name]) => `    "${name}": "firsat|bekle|dikkat"`).join(',\n')

  const prompt = `Sen deneyimli bir Türk finansal analistisin. Aşağıdaki güncel piyasa verilerini analiz et.

Veriler (${new Date().toLocaleDateString('tr-TR')}):
${lines}

Türk yatırımcısının bakış açısıyla — enflasyon, TL değer kaybı ve kısa vadeli momentum göz önünde bulundurarak — yatırım sinyali ver.

Yanıtını YALNIZCA şu JSON formatında ver, başka hiçbir şey yazma:
{
  "sinyaller": {
${signalKeys}
  },
  "ozet": "Kısa 2-3 cümle Türkçe yorum."
}

Geçerli sinyal değerleri: "firsat", "bekle", "dikkat"`

  const text = await callClaude(apiKey, prompt, 300)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude geçersiz yanıt döndürdü')
  return JSON.parse(match[0])
}
