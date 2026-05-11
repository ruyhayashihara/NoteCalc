interface KeyProps {
  label: string;
  onClick: (val: string) => void;
  variant?: 'default' | 'operator' | 'ac' | 'del' | 'scientific' | 'k2-ac' | 'k2-operator' | 'scientific-eq';
  theme: any;
}

export const Key = ({ label, onClick, variant = 'default', theme }: KeyProps) => {
  const isEnter = label === '↵';
  const getStyle = () => {
    switch (variant) {
      case 'ac':
        return { backgroundColor: '#cb7145', color: '#ffffff' };
      case 'del':
        return { backgroundColor: '#b6c7d5', color: '#1f2937' };
      case 'operator':
        return { backgroundColor: theme.colors.keyOperator, color: theme.colors.text };
      case 'scientific':
        return { backgroundColor: `${theme.colors.keyDefault}80`, color: theme.colors.text, fontSize: '0.9rem' };
      case 'k2-ac':
        return { backgroundColor: '#cb7145', color: '#ffffff' };
      case 'k2-operator':
        return { backgroundColor: theme.colors.keyOperator, color: theme.colors.text };
      case 'scientific-eq':
        return { backgroundColor: '#cb7145', color: '#ffffff' };
      default:
        return { backgroundColor: theme.colors.keyDefault, color: theme.colors.text };
    }
  };

  const style = getStyle();

  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onClick(label); }}
      className={`flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px] font-semibold text-lg select-none ${isEnter ? 'text-base' : ''}`}
      style={{ 
        ...style,
        borderColor: theme.colors.border,
      }}
    >
      {isEnter ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 10 4 15 9 20" />
          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </svg>
      ) : label}
    </button>
  );
};
