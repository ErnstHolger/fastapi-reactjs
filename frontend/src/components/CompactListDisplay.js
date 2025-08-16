import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CompactListDisplay = ({ items = [], label, maxVisible = 2, color = 'blue' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground text-sm">None</span>;
  }

  const visibleItems = isExpanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {visibleItems.map((item, idx) => (
          <span 
            key={idx} 
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${colorClasses[color]}`}
          >
            {item}
          </span>
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              +{items.length - maxVisible} more
            </>
          )}
        </button>
      )}
      
      {items.length === 1 && (
        <div className="text-xs text-muted-foreground">
          1 {label?.toLowerCase() || 'item'}
        </div>
      )}
      
      {items.length > 1 && (
        <div className="text-xs text-muted-foreground">
          {items.length} {label?.toLowerCase() || 'items'}
        </div>
      )}
    </div>
  );
};

export default CompactListDisplay;