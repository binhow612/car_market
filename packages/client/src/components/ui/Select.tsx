import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Select({ value, onValueChange, children, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (itemValue: string) => {
    setSelectedValue(itemValue);
    onValueChange?.(itemValue);
    setIsOpen(false);
  };

  const selectedItem = React.Children.toArray(children)
    .find((child: any) => child?.props?.value === selectedValue);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {React.Children.map(children, (child: any) => {
        if (child?.type?.name === 'SelectTrigger') {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            isOpen,
            selectedValue,
          });
        }
        if (child?.type?.name === 'SelectContent') {
          return isOpen ? React.cloneElement(child, {
            onItemClick: handleItemClick,
            selectedValue,
          }) : null;
        }
        return null;
      })}
    </div>
  );
}

export function SelectTrigger({ children, className = '', onClick, isOpen, selectedValue }: SelectTriggerProps & { onClick?: () => void; isOpen?: boolean; selectedValue?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      <span className="block truncate">
        {selectedValue ? children : 'Select an option'}
      </span>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

export function SelectContent({ children, className = '', onItemClick, selectedValue }: SelectContentProps & { onItemClick?: (value: string) => void; selectedValue?: string }) {
  return (
    <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}>
      {React.Children.map(children, (child: any) => {
        if (child?.type?.name === 'SelectItem') {
          return React.cloneElement(child, {
            onClick: () => onItemClick?.(child.props.value),
            isSelected: child.props.value === selectedValue,
          });
        }
        return child;
      })}
    </div>
  );
}

export function SelectItem({ value, children, className = '', onClick, isSelected }: SelectItemProps & { onClick?: () => void; isSelected?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
        isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}