import { Plus } from 'lucide-react';

export function FAB({ icon, label, onClick, title }) {
  const Icon = icon || Plus;
  return (
    <button
      onClick={onClick}
      title={title || label}
      className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40
        bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white
        rounded-full shadow-lg hover:shadow-xl
        flex items-center gap-2 py-3.5 px-5
        transition-all duration-200 active:scale-95 animate-scale-in"
    >
      <Icon size={20} />
      {label && <span className="font-semibold text-sm hidden sm:inline">{label}</span>}
    </button>
  );
}
