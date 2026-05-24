import SignalBadge from './SignalBadge'
import { getSignal } from '../utils/signals'

export default function InstrumentCard({ instrument }) {
  const { isim, tip, fiyat, degisim } = instrument
  const signal = getSignal(isim)
  const isPositive = parseFloat(degisim) >= 0

  return (
    <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{tip}</span>
          <SignalBadge signal={signal} />
        </div>
        <span className="text-white font-semibold text-base">{isim}</span>
        <span className="text-slate-300 text-sm">{fiyat}</span>
      </div>
      <div className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{degisim}%
      </div>
    </div>
  )
}
