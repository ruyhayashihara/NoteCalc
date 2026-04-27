import { Delete } from 'lucide-react';

interface KeyProps {
  key?: string | number;
  label: string;
  onClick: (val: string) => void;
  variant?: 'default' | 'operator' | 'ac' | 'del' | 'nav' | 'k2-operator' | 'k2-ac';
}

export const Key = ({ label, onClick, variant = 'default' }: KeyProps) => {
  let bg = 'bg-[#f4f5f7] hover:bg-[#e4e6ea]';
  let textColor = 'text-gray-800 font-medium';
  let border = 'border-r border-b border-[#c8d0d8]';

  switch (variant) {
    case 'ac':
      bg = 'bg-[#cb7145] hover:bg-[#b86138]';
      border = 'border-r border-b border-[#af5e35]';
      textColor = 'text-white';
      break;
    case 'del':
      bg = 'bg-[#8296a8] hover:bg-[#728595]';
      border = 'border-r border-b border-[#6c7d8c]';
      textColor = 'text-white';
      break;
    case 'operator':
      bg = 'bg-[#b6c7d5] hover:bg-[#a5b7c6]';
      border = 'border-r border-b border-[#a8b8c5]';
      break;
    case 'k2-ac':
      bg = 'bg-red-50 hover:bg-red-100';
      textColor = 'text-red-600';
      break;
    case 'k2-operator':
      bg = 'bg-blue-50 hover:bg-blue-100';
      textColor = 'text-blue-700';
      break;
    case 'nav':
      bg = 'bg-white hover:bg-gray-50';
      break;
  }

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onClick(label);
      }}
      className={`flex items-center justify-center py-2 text-xl sm:text-2xl ${bg} ${textColor} ${border} active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]`}
    >
      {label === 'DEL' ? <Delete size={24} /> : label}
    </button>
  );
};
