import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({
  label,
  placeholder = "Select items...",
  items = [],
  selectedItems = [],
  onSelectionChange,
  searchPlaceholder = "Search...",
  error = null,
  className = "",
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter and sort items - selected items first
  const getFilteredItems = () => {
    const filtered = items.filter(item => {
      const itemId = item.Id || item.id || item.ID || '';
      const itemName = item.Name || item.name || item.NAME || '';
      const itemDesc = item.Description || item.description || item.DESC || '';
      const searchLower = searchTerm.toLowerCase();
      
      return itemId.toLowerCase().includes(searchLower) || 
             itemName.toLowerCase().includes(searchLower) || 
             itemDesc.toLowerCase().includes(searchLower);
    });
    
    // Sort with selected items first - be more robust with ID matching
    return filtered.sort((a, b) => {
      const aId = a.Id || a.id || a.ID || '';
      const bId = b.Id || b.id || b.ID || '';
      const aSelected = selectedItems.includes(aId) || selectedItems.includes(String(aId));
      const bSelected = selectedItems.includes(bId) || selectedItems.includes(String(bId));
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return aId.localeCompare(bId); // Secondary sort by ID for consistency
    });
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemToggle = (itemId, isSelected) => {
    const newSelection = isSelected 
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedItems.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }
    
    if (selectedItems.length === 1) {
      const item = items.find(item => {
        const itemId = item.Id || item.id || item.ID || '';
        return itemId === selectedItems[0] || String(itemId) === String(selectedItems[0]);
      });
      return item?.Name || item?.name || item?.NAME || selectedItems[0];
    }
    
    return `${selectedItems.length} items selected`;
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label} ({selectedItems.length} selected)
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border border-border rounded-md bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-between"
        >
          <div className="flex-1 truncate">
            {getDisplayText()}
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full min-w-96 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Items List */}
            <div className="overflow-y-auto max-h-60">
              {getFilteredItems().map((item, index) => {
                const itemId = item.Id || item.id || item.ID || `item_${index}`;
                const itemName = item.Name || item.name || item.NAME || itemId;
                const itemDesc = item.Description || item.description || item.DESC || '';
                const isSelected = selectedItems.includes(itemId) || selectedItems.includes(String(itemId));
                
                return (
                  <div
                    key={`${itemId}_${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemToggle(itemId, isSelected);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
                      isSelected ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{itemName}</div>
                      {itemDesc && (
                        <div className={`text-xs truncate ${
                          isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>{itemDesc}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {getFilteredItems().length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {searchTerm ? 'No items found' : 'No items available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default MultiSelectDropdown;