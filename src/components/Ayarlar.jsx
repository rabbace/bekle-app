import { useState } from 'react'
import { getApiKey, saveApiKey, getFinnhubKey, saveFinnhubKey } from '../utils/storage'

export default function Ayarlar() {
  const [apiKey, setApiKey] = useState(getApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const [finnhubKey, setFinnhubKey] = useState(getFinnhubKey)
  const [showFinnhubKey, setShowFinnhubKey] = useState(false)
  const [finnhubSaved, setFinnhubSaved] = useState(false)

  function handleSave() {
    saveApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleFinnhubSave() {
    saveFinnhubKey(finnhubKey)
    setFinnhubSaved(true)
    setTimeout(() => setFinnhubSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h2 className="text-white font-bold text-lg">Ayarlar</h2>

      {/* Claude API Key */}
      <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Claude API Anahtarı</h3>
          <p className="text-slate-500 text-xs mt-1">
            Gerçek zamanlı sinyal analizi için gereklidir. Anahtarınız yalnızca cihazınızda saklanır.
          </p>
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={() => setShowKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
          >
            {showKey ? 'Gizle' : 'Göster'}
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* Finnhub API Key */}
      <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Finnhub API Anahtarı</h3>
          <p className="text-slate-500 text-xs mt-1">
            Hisse analizi için gerekli.{' '}
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              finnhub.io/register
            </a>{' '}
            adresinden ücretsiz alabilirsiniz.
          </p>
        </div>
        <div className="relative">
          <input
            type={showFinnhubKey ? 'text' : 'password'}
            value={finnhubKey}
            onChange={e => setFinnhubKey(e.target.value)}
            placeholder="API anahtarınız..."
            className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={() => setShowFinnhubKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
          >
            {showFinnhubKey ? 'Gizle' : 'Göster'}
          </button>
        </div>
        <button
          onClick={handleFinnhubSave}
          className={`py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            finnhubSaved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {finnhubSaved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* Hakkında */}
      <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
        <h3 className="text-white font-semibold text-sm">Hakkında</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          <span className="text-white font-bold">Bekle.</span> — kişisel yatırım zamanlama asistanı.
          Piyasa sinyallerini analiz ederek doğru zamanda harekete geçmenizi sağlar.
        </p>
        <p className="text-slate-600 text-xs mt-1">v0.1.0</p>
      </div>
    </div>
  )
}
