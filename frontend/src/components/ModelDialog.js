import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import StreamSelectPanel from './StreamSelectPanel';

const ModelDialog = ({ open, onClose, onSave, model, streams, mode }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    model_type: 'NBEATS',
    past_covariates: [],
    target: [],
    future_covariates: [],
    status: [],
    training_horizon: 0,
    forecast_horizon: 0,
    update_frequency: 0,
    retrain_frequency: 0,
    sampling_rate: 0
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (model && mode === 'edit') {
      setFormData({
        id: model.id || '',
        name: model.name || '',
        description: model.description || '',
        model_type: model.model_type || 'NBEATS',
        past_covariates: model.past_covariates || [],
        target: model.target || [],
        future_covariates: model.future_covariates || [],
        status: model.status || [],
        training_horizon: model.training_horizon || 14400,
        forecast_horizon: model.forecast_horizon || 120,
        update_frequency: model.update_frequency || 30,
        retrain_frequency: model.retrain_frequency || 7200,
        sampling_rate: model.sampling_rate || 0
      });
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        model_type: 'NBEATS',
        past_covariates: [],
        target: [],
        future_covariates: [],
        status: [],
        training_horizon: 0,
        forecast_horizon: 0,
        update_frequency: 0,
        retrain_frequency: 0,
        sampling_rate: 0
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.id.trim()) newErrors.id = 'ID is required';
    if (!formData.model_type.trim()) newErrors.model_type = 'Model type is required';
    if (formData.past_covariates.length === 0) newErrors.past_covariates = 'At least one past covariate is required';
    if (formData.target.length === 0) newErrors.target = 'At least one target is required';
    if (formData.training_horizon <= 0) newErrors.training_horizon = 'Training horizon must be positive';
    if (formData.forecast_horizon <= 0) newErrors.forecast_horizon = 'Forecast horizon must be positive';
    if (formData.update_frequency <= 0) newErrors.update_frequency = 'Update frequency must be positive';
    if (formData.retrain_frequency <= 0) newErrors.retrain_frequency = 'Retrain frequency must be positive';
    if (formData.sampling_rate <= 0) newErrors.sampling_rate = 'Sampling rate must be positive';

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
                  <label className="block text-sm font-medium mb-2">ID</label>
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
                  <label className="block text-sm font-medium mb-2">Name</label>
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
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background h-20"
                  rows={3}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model Type</label>
                <Select value={formData.model_type} onValueChange={(value) => handleInputChange('model_type', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NBEATS">NBEATS</SelectItem>
                    <SelectItem value="TRANSFORMER">Transformer</SelectItem>
                    <SelectItem value="LSTM">LSTM</SelectItem>
                    <SelectItem value="ARIMA">ARIMA</SelectItem>
                  </SelectContent>
                </Select>
                {errors.model_type && <p className="text-red-500 text-xs mt-1">{errors.model_type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Training Horizon</label>
                  <input
                    type="number"
                    value={formData.training_horizon}
                    onChange={(e) => handleInputChange('training_horizon', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.training_horizon && <p className="text-red-500 text-xs mt-1">{errors.training_horizon}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Forecast Horizon</label>
                  <input
                    type="number"
                    value={formData.forecast_horizon}
                    onChange={(e) => handleInputChange('forecast_horizon', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.forecast_horizon && <p className="text-red-500 text-xs mt-1">{errors.forecast_horizon}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Update Frequency</label>
                  <input
                    type="number"
                    value={formData.update_frequency}
                    onChange={(e) => handleInputChange('update_frequency', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.update_frequency && <p className="text-red-500 text-xs mt-1">{errors.update_frequency}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Retrain Frequency</label>
                  <input
                    type="number"
                    value={formData.retrain_frequency}
                    onChange={(e) => handleInputChange('retrain_frequency', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.retrain_frequency && <p className="text-red-500 text-xs mt-1">{errors.retrain_frequency}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sampling Rate</label>
                  <input
                    type="number"
                    value={formData.sampling_rate}
                    onChange={(e) => handleInputChange('sampling_rate', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                    min="1"
                  />
                  {errors.sampling_rate && <p className="text-red-500 text-xs mt-1">{errors.sampling_rate}</p>}
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