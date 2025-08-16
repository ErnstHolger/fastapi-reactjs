import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "../../lib/utils"

const MultiSelect = React.forwardRef(({
  label,
  placeholder = "Select items...",
  items = [],
  selectedItems = [],
  onSelectionChange,
  searchPlaceholder = "Search...",
  error = null,
  className = "",
  required = false,
  maxVisible = 2,
  ...props
}, ref) => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  // Filter and sort items - selected items first
  const getFilteredItems = React.useMemo(() => {
    const filtered = items.filter(item => {
      const itemId = item.Id || item.id || item.ID || '';
      const itemName = item.Name || item.name || item.NAME || '';
      const itemDesc = item.Description || item.description || item.DESC || '';
      const searchLower = searchTerm.toLowerCase();
      
      return itemId.toLowerCase().includes(searchLower) || 
             itemName.toLowerCase().includes(searchLower) || 
             itemDesc.toLowerCase().includes(searchLower);
    });
    
    // Sort with selected items first
    return filtered.sort((a, b) => {
      const aId = a.Id || a.id || a.ID || '';
      const bId = b.Id || b.id || b.ID || '';
      const aSelected = selectedItems.includes(aId) || selectedItems.includes(String(aId));
      const bSelected = selectedItems.includes(bId) || selectedItems.includes(String(bId));
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return aId.localeCompare(bId);
    });
  }, [items, selectedItems, searchTerm]);

  const handleItemToggle = (itemId) => {
    const isSelected = selectedItems.includes(itemId) || selectedItems.includes(String(itemId));
    const newSelection = isSelected 
      ? selectedItems.filter(id => id !== itemId && String(id) !== String(itemId))
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedItems.length === 0) {
      return placeholder;
    }
    
    if (selectedItems.length === 1) {
      const item = items.find(item => {
        const itemId = item.Id || item.id || item.ID || '';
        return itemId === selectedItems[0] || String(itemId) === String(selectedItems[0]);
      });
      return item?.Name || item?.name || item?.NAME || selectedItems[0];
    }
    
    if (selectedItems.length <= maxVisible) {
      return selectedItems.map(id => {
        const item = items.find(item => {
          const itemId = item.Id || item.id || item.ID || '';
          return itemId === id || String(itemId) === String(id);
        });
        return item?.Name || item?.name || item?.NAME || id;
      }).join(', ');
    }
    
    return `${selectedItems.length} items selected`;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} ({selectedItems.length} selected)
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500",
              className
            )}
            {...props}
          >
            <span className={cn(
              "truncate text-left",
              selectedItems.length === 0 && "text-muted-foreground"
            )}>
              {getDisplayText()}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className="w-[var(--radix-popover-trigger-width)] max-w-[500px] min-w-[300px] p-0 bg-popover border rounded-md shadow-md z-50"
            align="start"
            sideOffset={4}
          >
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex-1 outline-none placeholder:text-muted-foreground text-sm bg-transparent"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Items List */}
            <div className="max-h-60 overflow-auto p-1">
              {getFilteredItems.length > 0 ? (
                getFilteredItems.map((item, index) => {
                  const itemId = item.Id || item.id || item.ID || `item_${index}`;
                  const itemName = item.Name || item.name || item.NAME || itemId;
                  const itemDesc = item.Description || item.description || item.DESC || '';
                  const isSelected = selectedItems.includes(itemId) || selectedItems.includes(String(itemId));
                  
                  return (
                    <div
                      key={`${itemId}_${index}`}
                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleItemToggle(itemId)}
                    >
                      <CheckboxPrimitive.Root
                        className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        checked={isSelected}
                        onCheckedChange={() => handleItemToggle(itemId)}
                      >
                        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                          <Check className="h-4 w-4" />
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{itemName}</div>
                        {itemDesc && (
                          <div className="text-xs text-muted-foreground truncate">{itemDesc}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {searchTerm ? 'No items found' : 'No items available'}
                </div>
              )}
            </div>

            {/* Selected Count Footer */}
            {selectedItems.length > 0 && (
              <div className="border-t px-3 py-2 bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect }