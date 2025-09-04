import React from 'react';
import { MultiSelect } from './ui/multi-select';
import { Tooltip } from './ui/tooltip';

const StreamSelectPanel = ({ 
  streams, 
  formData, 
  onInputChange, 
  errors 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b border-border pb-2">Stream Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Past</label>
            <Tooltip content="Historical input features">
              <button
                type="button"
                className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <MultiSelect
            placeholder="Select past covariates..."
            searchPlaceholder="Search past covariates..."
            items={streams || []}
            selectedItems={formData.past}
            onSelectionChange={(newSelection) => onInputChange('past', newSelection)}
            error={errors.past}
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Target</label>
            <Tooltip content="Model prediction targets">
              <button
                type="button"
                className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <MultiSelect
            placeholder="Select target streams..."
            searchPlaceholder="Search target streams..."
            items={streams || []}
            selectedItems={formData.target}
            onSelectionChange={(newSelection) => onInputChange('target', newSelection)}
            error={errors.target}
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Future</label>
            <Tooltip content="Known future data (optional)">
              <button
                type="button"
                className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <MultiSelect
            placeholder="Select future covariates..."
            searchPlaceholder="Search future covariates..."
            items={streams || []}
            selectedItems={formData.future}
            onSelectionChange={(newSelection) => onInputChange('future', newSelection)}
            error={errors.future}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">Status</label>
            <Tooltip content="Status/monitoring streams">
              <button
                type="button"
                className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <MultiSelect
            placeholder="Select status streams..."
            searchPlaceholder="Search status streams..."
            items={streams || []}
            selectedItems={formData.status}
            onSelectionChange={(newSelection) => onInputChange('status', newSelection)}
            error={errors.status}
          />
        </div>
      </div>
    </div>
  );
};

export default StreamSelectPanel;