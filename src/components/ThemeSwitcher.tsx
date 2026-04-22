// src/components/ThemeSwitcher.tsx
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ChevronDown, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme: currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find(t => t.id === currentTheme);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger — muestra el tema actual */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 transition-all"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded-full border-2 border-k-border shadow-sm"
            style={{ backgroundColor: activeTheme?.preview }}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-k-text-h">{activeTheme?.label}</p>
            <p className="text-xs text-k-text-b">{activeTheme?.description}</p>
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-k-text-b transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown de temas */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 rounded-xl border border-k-border bg-k-bg-card shadow-k-card overflow-hidden max-h-[300px] overflow-y-auto">
          <div className="px-3 pb-2 mb-1 border-b border-k-border">
            <p className="text-xs font-semibold text-k-text-b uppercase tracking-wider">Selecciona un tema</p>
          </div>

          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-k-bg-card2
                ${currentTheme === t.id ? 'bg-k-bg-card2' : ''}
              `}
            >
              {/* Preview dot */}
              <div className="relative flex-shrink-0">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-k-border shadow-sm"
                  style={{ backgroundColor: t.preview }}
                />
                {currentTheme === t.id && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-k-accent-btn text-k-accent-btn-text flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${currentTheme === t.id ? 'text-k-text-h' : 'text-k-text-b'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-k-text-b truncate">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
