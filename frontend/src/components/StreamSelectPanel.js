import React from 'react';
import { MultiSelect } from './ui/multi-select';

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
        <MultiSelect
          label="Past Covariates"
          placeholder="Select past covariates..."
          searchPlaceholder="Search past covariates..."
          items={streams || []}
          selectedItems={formData.past_covariates}
          onSelectionChange={(newSelection) => onInputChange('past_covariates', newSelection)}
          error={errors.past_covariates}
          required
        />

        <MultiSelect
          label="Target"
          placeholder="Select target streams..."
          searchPlaceholder="Search target streams..."
          items={streams || []}
          selectedItems={formData.target}
          onSelectionChange={(newSelection) => onInputChange('target', newSelection)}
          error={errors.target}
          required
        />

        <MultiSelect
          label="Future Covariates"
          placeholder="Select future covariates..."
          searchPlaceholder="Search future covariates..."
          items={streams || []}
          selectedItems={formData.future_covariates}
          onSelectionChange={(newSelection) => onInputChange('future_covariates', newSelection)}
          error={errors.future_covariates}
        />

        <MultiSelect
          label="Status"
          placeholder="Select status streams..."
          searchPlaceholder="Search status streams..."
          items={streams || []}
          selectedItems={formData.status}
          onSelectionChange={(newSelection) => onInputChange('status', newSelection)}
          error={errors.status}
        />
      </div>
    </div>
  );
};

export default StreamSelectPanel;