import { type ButtonHTMLAttributes, type ReactNode } from 'react';

// Definimos los estilos que tendrá según la prop "variant"
type ButtonVariant = 'primary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-green-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
};

export default function Button({ 
  variant = 'primary', 
  loading = false, 
  children, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}