import { SIGNAL_CONFIG } from '../utils/signals'

export default function SignalBadge({ signal, live = false }) {
  const cfg = SIGNAL_CONFIG[signal] || SIGNAL_CONFIG.bekle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.dot} {cfg.label}
      {live && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 ml-0.5" title="Canlı sinyal" />}
    </span>
  )
}
