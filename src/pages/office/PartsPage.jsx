import { useState } from 'react';
import PartsCatalog from './parts/PartsCatalog';
import PartsStock from './parts/PartsStock';
import PartsOrders from './parts/PartsOrders';
import PartsPricing from './parts/PartsPricing';
import AssemblyInstructions from './parts/AssemblyInstructions';

const SUB_TABS = [
  { id: 'catalog', label: 'קטלוג חלקים', icon: '🔧' },
  { id: 'stock', label: 'מלאי ואצוות', icon: '📦' },
  { id: 'orders', label: 'הזמנות', icon: '🛒' },
  { id: 'pricing', label: 'תמחור', icon: '💰' },
  { id: 'assembly', label: 'הוראות הרכבה', icon: '📋' },
];

const COMPONENTS = {
  catalog: PartsCatalog,
  stock: PartsStock,
  orders: PartsOrders,
  pricing: PartsPricing,
  assembly: AssemblyInstructions,
};

export default function PartsPage() {
  const [activeTab, setActiveTab] = useState('catalog');
  const ActiveComponent = COMPONENTS[activeTab];

  return (
    <div>
      {/* sub-navigation */}
      <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ActiveComponent />
    </div>
  );
}
