import { useState } from 'react'

const TIPLER = ['Altın', 'USD', 'EUR', 'BIST', 'TEFAS']

export default function AddInstrumentModal({ onSave, onClose }) {
  const [tip, setTip] = useState('Altın')
  const [isim, setIsim] = useState('')
  const [miktar, setMiktar] = useState('')

  function handleSave() {
    if (!isim.trim()) return
    onSave({ tip, isim: isim.trim(), miktar: miktar.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Enstrüman Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-400 text-sm">Tip</label>
          <div className="flex gap-2 flex-wrap">
            {TIPLER.map(t => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  tip === t ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-400 text-sm">
            İsim {tip === 'BIST' && <span className="text-slate-500">(örn: TUPRS, FROTO)</span>}
          </label>
          <input
            type="text"
            value={isim}
            onChange={e => setIsim(e.target.value)}
            placeholder={tip === 'BIST' ? 'TUPRS' : tip === 'TEFAS' ? 'Fon adı' : tip}
            className="bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-400 text-sm">Miktar <span className="text-slate-500">(opsiyonel)</span></label>
          <input
            type="text"
            value={miktar}
            onChange={e => setMiktar(e.target.value)}
            placeholder="örn: 100"
            className="bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!isim.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Kaydet
        </button>
      </div>
    </div>
  )
}
