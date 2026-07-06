import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { SettingsBusiness } from './settings/SettingsBusiness';
import { SettingsStatuses } from './settings/SettingsStatuses';
import { SettingsSuppliers } from './settings/SettingsSuppliers';
import { ManufacturersModels } from './settings/ManufacturersModels';
import { SettingsMisc } from './settings/SettingsMisc';
import { SettingsRoles } from './settings/SettingsRoles';
import { SettingsFields } from './settings/SettingsFields';
import { SettingsStorage } from './settings/SettingsStorage';

const SUB_TABS = [
  { id: 'business',  label: 'פרטי עסק',        icon: '🏢' },
  { id: 'statuses',  label: 'ניהול סטטוסים',   icon: '🏷️' },
  { id: 'suppliers', label: 'ניהול ספקים',      icon: '🚚' },
  { id: 'catalog',   label: 'יצרנים ודגמים',    icon: '🏭' },
  { id: 'roles',     label: 'ניהול תפקידים',    icon: '👥' },
  { id: 'fields',    label: 'ניהול שדות',       icon: '📋' },
  { id: 'misc',      label: 'הגדרות שונות',     icon: '⚙️' },
  { id: 'storage',   label: 'ניהול אחסון',      icon: '💾' },
];

const COMPONENTS = {
  business:  SettingsBusiness,
  statuses:  SettingsStatuses,
  suppliers: SettingsSuppliers,
  catalog:   ManufacturersModels,
  roles:     SettingsRoles,
  fields:    SettingsFields,
  misc:      SettingsMisc,
  storage:   SettingsStorage,
};

export default function OfficeSettings() {
  const [activeTab, setActiveTab] = useState('business');
  const ActiveComponent = COMPONENTS[activeTab];

  return (
    <div>
      <PageHeader title="הגדרות מערכת" subtitle="הגדרות עסק וניהול נתונים" />

      <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1.5 mb-4 overflow-x-auto">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
