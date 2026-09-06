import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "اختر من القائمة...",
  searchPlaceholder = "بحث برقم اللوط، الكود، أو اسم المورد...",
  emptyText = "لا توجد نتائج مطابقة",
  className = "",
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-2.5 rounded-lg border border-gray-300 bg-white text-right text-xs flex items-center justify-between gap-2 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#012d1d] transition-colors"
      >
        <span className="truncate font-sans font-medium text-gray-900">
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-bold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-gray-500 font-sans truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400 font-sans">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col right-0 min-w-[240px]">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none font-sans"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 divide-y divide-gray-50 py-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-sans">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full p-2.5 text-right flex items-center justify-between text-xs transition-colors ${
                      isSelected ? "bg-emerald-50 text-[#012d1d] font-semibold" : "hover:bg-gray-50 text-gray-800"
                    } ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex flex-col items-start gap-0.5 truncate">
                      <span className="font-mono font-bold text-xs truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-gray-500 font-sans truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            opt.badgeColor || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#012d1d]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
