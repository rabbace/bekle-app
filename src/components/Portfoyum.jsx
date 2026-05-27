import { useState, useEffect } from 'react'
import AddInstrumentModal from './AddInstrumentModal'
import SignalBadge from './SignalBadge'
import { getPortfolio, addToPortfolio, removeFromPortfolio } from '../utils/storage'
import { getSignal } from '../utils/signals'

export default function Portfoyum() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setItems(getPortfolio())
  }, [])

  function handleSave(item) {
    const updated = addToPortfolio(item)
    setItems(updated)
  }

  function handleRemove(id) {
    const updated = removeFromPortfolio(id)
    setItems(updated)
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Portföyüm</h2>
        <span className="text-slate-400 text-sm">{items.length} enstrüman</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">📊</span>
          <p className="text-slate-400 text-sm">Henüz enstrüman eklemediniz.</p>
          <p className="text-slate-500 text-xs">Sağ alttaki + butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{item.tip}</span>
                  <SignalBadge signal={getSignal(item.isim)} />
                </div>
                <span className="text-white font-semibold">{item.isim}</span>
                {item.miktar && (
                  <span className="text-slate-500 text-xs">Miktar: {item.miktar}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-slate-600 hover:text-red-400 transition-colors text-xl leading-none"
                title="Kaldır"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-colors z-40"
        aria-label="Enstrüman ekle"
      >
        +
      </button>

      {showModal && (
        <AddInstrumentModal onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
