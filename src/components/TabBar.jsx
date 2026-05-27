const TABS = [
  { id: 'ana',    label: 'Ana Ekran', icon: '📈' },
  { id: 'portfoy', label: 'Portföyüm', icon: '💼' },
  { id: 'hisse',  label: 'Hisse',     icon: '📊' },
  { id: 'ayarlar', label: 'Ayarlar',   icon: '⚙️' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/50 z-30">
      <div className="max-w-sm mx-auto flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
