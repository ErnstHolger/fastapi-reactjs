import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip } from './ui/tooltip';
import StreamSelectPanel from './StreamSelectPanel';

const ModelDialog = ({ open, onClose, onSave, model, streams, mode }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    model_type: 'LINEAR',
    past: [],
    target: [],
    future: [],
    status: [],
    lag: 20,
    lead: 10,
    update: '0 */30 * * * *',
    retrain: '0 0 */12 * * *',
    interval: 5
  });

  const [errors, setErrors] = useState({});

  // Validate cron expression format
  const validateCron = (cronExpression) => {
    if (!cronExpression || typeof cronExpression !== 'string') return false;
    
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 6) return false; // Should have 6 parts for seconds format
    
    // Basic validation for each part
    const patterns = [
      /^(\*|[0-5]?\d)$/, // seconds: 0-59
      /^(\*|[0-5]?\d)$/, // minutes: 0-59
      /^(\*|[01]?\d|2[0-3])$/, // hours: 0-23
      /^(\*|[12]?\d|3[01])$/, // day of month: 1-31
      /^(\*|[01]?\d)$/, // month: 1-12
      /^(\*|[0-6])$/ // day of week: 0-6
    ];
    
    // Allow ranges, lists, and step values
    const advancedPatterns = [
      /^(\*|[0-5]?\d|\*\/\d+|[0-5]?\d-[0-5]?\d|([0-5]?\d,)*[0-5]?\d)$/, // seconds
      /^(\*|[0-5]?\d|\*\/\d+|[0-5]?\d-[0-5]?\d|([0-5]?\d,)*[0-5]?\d)$/, // minutes
      /^(\*|[01]?\d|2[0-3]|\*\/\d+|[01]?\d-[01]?\d|2[0-3]-2[0-3]|([01]?\d|2[0-3],)*([01]?\d|2[0-3]))$/, // hours
      /^(\*|[12]?\d|3[01]|\*\/\d+|[12]?\d-[12]?\d|3[01]-3[01]|([12]?\d|3[01],)*([12]?\d|3[01]))$/, // day of month
      /^(\*|[01]?\d|\*\/\d+|[01]?\d-[01]?\d|([01]?\d,)*[01]?\d)$/, // month
      /^(\*|[0-6]|\*\/\d+|[0-6]-[0-6]|([0-6],)*[0-6])$/ // day of week
    ];
    
    return parts.every((part, index) => advancedPatterns[index].test(part));
  };

  useEffect(() => {
    if (model && mode === 'edit') {
      setFormData({
        id: model.id || '',
        name: model.name || '',
        description: model.description || '',
        model_type: model.model_type || 'LINEAR',
        past: model.past || [],
        target: model.target || [],
        future: model.future || [],
        status: model.status || [],
        lag: model.lag || 20,
        lead: model.lead || 10,
        update: model.update || '0 */30 * * * *',
        retrain: model.retrain || '0 0 */12 * * *',
        interval: model.interval || 5
      });
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        model_type: 'LINEAR',
        past: [],
        target: [],
        future: [],
        status: [],
        lag: 20,
        lead: 10,
        update: '0 */30 * * * *',
        retrain: '0 0 */12 * * *',
        interval: 5
      });
    }
    setErrors({});


    if (open) {
      console.log('ModelDialog opened!');
      console.log('ModelDialog: streams prop:', streams);
      console.log('ModelDialog: streams length:', streams?.length);
      console.log('ModelDialog: streams is array?', Array.isArray(streams));
      if (streams && streams.length > 0) {
        console.log('ModelDialog: first stream:', streams[0]);
      }
    }
  }, [model, mode, open, streams]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear existing error and validate cron expressions in real-time
    const newErrors = { ...errors };
    if (field === 'update' || field === 'retrain') {
      if (value.trim() === '') {
        newErrors[field] = `${field === 'update' ? 'Update' : 'Retrain'} cron expression is required`;
      } else if (!validateCron(value)) {
        newErrors[field] = 'Invalid cron expression format';
      } else {
        delete newErrors[field];
      }
    } else if (errors[field]) {
      delete newErrors[field];
    }
    
    setErrors(newErrors);
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.id.trim()) newErrors.id = 'ID is required';
    if (!formData.model_type.trim()) newErrors.model_type = 'Model type is required';
    if (formData.past.length === 0) newErrors.past = 'At least one past covariate is required';
    if (formData.target.length === 0) newErrors.target = 'At least one target is required';
    if (formData.lag <= 0) newErrors.lag = 'Lag must be positive';
    if (formData.lead <= 0) newErrors.lead = 'Lead must be positive';
    if (!formData.update.trim()) {
      newErrors.update = 'Update cron expression is required';
    } else if (!validateCron(formData.update)) {
      newErrors.update = 'Invalid cron expression format';
    }
    if (!formData.retrain.trim()) {
      newErrors.retrain = 'Retrain cron expression is required';
    } else if (!validateCron(formData.retrain)) {
      newErrors.retrain = 'Invalid cron expression format';
    }
    if (formData.interval <= 0) newErrors.interval = 'Interval must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Model' : 'Edit Model'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Model Information and Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-border pb-2">Model Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">ID</label>
                    <Tooltip content="Unique model identifier">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    disabled={mode === 'edit'}
                  />
                  {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Name</label>
                    <Tooltip content="Model display name">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium">Description</label>
                  <Tooltip content="Model description and purpose">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                    >
                      ?
                    </button>
                  </Tooltip>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background h-20"
                  rows={3}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium">Model Type</label>
                  <Tooltip content="ML algorithm type">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                    >
                      ?
                    </button>
                  </Tooltip>
                </div>
                <Select value={formData.model_type} onValueChange={(value) => handleInputChange('model_type', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINEAR">Linear</SelectItem>
                    <SelectItem value="RANDOM FOREST">Random Forest</SelectItem>
                    <SelectItem value="XGBOOST">XGBoost</SelectItem>
                    <SelectItem value="LIGHTGBM">LightGBM</SelectItem>
                    <SelectItem value="CATBOOST">CatBoost</SelectItem>
                  </SelectContent>
                </Select>
                {errors.model_type && <p className="text-red-500 text-xs mt-1">{errors.model_type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Lag (seconds)</label>
                    <Tooltip content="Past time steps for training">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    value={formData.lag}
                    onChange={(e) => handleInputChange('lag', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.lag && <p className="text-red-500 text-xs mt-1">{errors.lag}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Lead (seconds)</label>
                    <Tooltip content="Future time steps to predict">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    value={formData.lead}
                    onChange={(e) => handleInputChange('lead', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.lead && <p className="text-red-500 text-xs mt-1">{errors.lead}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Update</label>
                    <Tooltip content="Cron schedule for updates">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="text"
                    value={formData.update}
                    onChange={(e) => handleInputChange('update', e.target.value)}
                    className={`w-full p-2 border rounded-md bg-background ${
                      errors.update ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'
                    }`}
                    placeholder="0 */30 * * * *"
                  />
                  {errors.update && <p className="text-red-500 text-xs mt-1">{errors.update}</p>}
                  {!errors.update && (
                    <p className="text-gray-500 text-xs mt-1">Format: sec min hour day month dayOfWeek</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Retrain</label>
                    <Tooltip content="Cron schedule for retraining">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="text"
                    value={formData.retrain}
                    onChange={(e) => handleInputChange('retrain', e.target.value)}
                    className={`w-full p-2 border rounded-md bg-background ${
                      errors.retrain ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary'
                    }`}
                    placeholder="0 0 */12 * * *"
                  />
                  {errors.retrain && <p className="text-red-500 text-xs mt-1">{errors.retrain}</p>}
                  {!errors.retrain && (
                    <p className="text-gray-500 text-xs mt-1">Format: sec min hour day month dayOfWeek</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Interval (seconds)</label>
                    <Tooltip content="Data sampling interval">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-xs text-white"
                      >
                        ?
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    value={formData.interval}
                    onChange={(e) => handleInputChange('interval', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.interval && <p className="text-red-500 text-xs mt-1">{errors.interval}</p>}
                </div>
              </div>
            </div>

            {/* Right Panel - Stream Selections */}
            <StreamSelectPanel
              streams={streams}
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDialog;