import { SIGNAL_CONFIG } from '../utils/signals'

export default function SignalBadge({ signal }) {
  const cfg = SIGNAL_CONFIG[signal] || SIGNAL_CONFIG.bekle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.dot} {cfg.label}
    </span>
  )
}
