interface KeyProps {
  label: string;
  onClick: (val: string) => void;
  variant?: 'default' | 'operator' | 'ac' | 'del' | 'scientific' | 'k2-ac' | 'k2-operator' | 'scientific-eq';
  theme: any;
}

export const Key = ({ label, onClick, variant = 'default', theme }: KeyProps) => {
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
      className="flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px] font-semibold text-lg select-none"
      style={{ 
        ...style,
        borderColor: theme.colors.border,
      }}
    >
      {label}
    </button>
  );
};
