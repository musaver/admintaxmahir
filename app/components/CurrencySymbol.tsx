import React from 'react';

interface CurrencySymbolProps {
  /** Additional CSS classes to apply */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * CurrencySymbol Component
 * 
 * Renders the custom currency symbol with proper font styling.
 * Use this component consistently across the admin app for currency displays.
 * 
 * @example
 * <CurrencySymbol /> {formattedPrice}
 */
const CurrencySymbol: React.FC<CurrencySymbolProps> = ({ 
  className = '', 
  style = {} 
}) => {
  return (
    <span 
      className={`currency-symbol ${className}`.trim()}
      style={style}
    >
      &#xe001;
    </span>
  );
};

export default CurrencySymbol; 