import { useState } from 'react'
import TabBar from './components/TabBar'
import AnaEkran from './components/AnaEkran'
import Portfoyum from './components/Portfoyum'
import Ayarlar from './components/Ayarlar'

export default function App() {
  const [activeTab, setActiveTab] = useState('ana')

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-sm mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Bekle<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Yatırım zamanlama asistanı</p>
        </header>

        {/* Content */}
        {activeTab === 'ana' && <AnaEkran />}
        {activeTab === 'portfoy' && <Portfoyum />}
        {activeTab === 'ayarlar' && <Ayarlar />}
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
