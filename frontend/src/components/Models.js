import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ModelDialog from './ModelDialog';
import PageHeader from './PageHeader';
import CompactListDisplay from './CompactListDisplay';
import axios from 'axios';

const Models = () => {
  const [models, setModels] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [isInitialized, setIsInitialized] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchingStreams, setFetchingStreams] = useState(false);

  const fetchModels = useCallback(async () => {
    if (fetchingModels) {
      console.log('Models: Already fetching models, skipping duplicate call');
      return;
    }

    try {
      setFetchingModels(true);
      console.log('Models: Fetching from http://127.0.0.1:8008/connect/models');
      const response = await axios.get('http://127.0.0.1:8008/connect/models', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      setModels(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setLoading(false);
      setFetchingModels(false);
    }
  }, [fetchingModels]);

  const fetchStreams = useCallback(async () => {
    if (fetchingStreams) {
      console.log('Models: Already fetching streams, skipping duplicate call');
      return;
    }

    try {
      setFetchingStreams(true);
      console.log('Models: Fetching streams from http://127.0.0.1:8008/connect/streams');
      const response = await axios.get('http://127.0.0.1:8008/connect/streams', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      console.log('Models: Response received:', response.status, response.data);
      console.log('Models: Data length:', response.data?.length);

      const streamsData = Array.isArray(response.data) ? response.data : [];
      setStreams(streamsData);
      console.log('Models: Set streams state to:', streamsData.length, 'items');
    } catch (error) {
      console.error('Models: Error fetching streams:', error);
      console.error('Models: Error details:', error.response?.data || error.message);
      setStreams([]);
    } finally {
      setFetchingStreams(false);
    }
  }, [fetchingStreams]);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      fetchModels();
      fetchStreams();
    }
  }, [isInitialized, fetchModels, fetchStreams]);

  const handleCreate = () => {
    setSelectedModel(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (model) => {
    setSelectedModel(model);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDelete = async (modelId) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await axios.delete('http://127.0.0.1:8008/connect/models', {
          params: { asset_id: modelId },
          headers: { 'Content-Type': 'application/json' }
        });
        fetchModels();
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('Error deleting model. Please try again.');
      }
    }
  };

  const handleSave = async (modelData) => {
    try {
      if (dialogMode === 'create') {
        await axios.post('http://127.0.0.1:8008/connect/models', modelData, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (dialogMode === 'edit') {
        await axios.put('http://127.0.0.1:8008/connect/models', modelData, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      fetchModels();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Error saving model. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader title="Models">
        <div className="flex justify-end">
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus size={20} />
            Create Model
          </Button>
        </div>
      </PageHeader>

      <div className="bg-card border border-border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Model Type</th>
                <th className="text-left p-4 font-semibold">Past</th>
                <th className="text-left p-4 font-semibold">Target</th>
                <th className="text-left p-4 font-semibold">Future</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.Id} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 font-medium">{model.name}</td>
                  <td className="p-4 text-muted-foreground">{model.model_type}</td>
                  <td className="p-4">
                    <CompactListDisplay
                      items={model.past}
                      label="Past"
                      color="blue"
                      maxVisible={2}
                    />
                  </td>
                  <td className="p-4">
                    <CompactListDisplay
                      items={model.target}
                      label="Targets"
                      color="green"
                      maxVisible={2}
                    />
                  </td>
                  <td className="p-4">
                    <CompactListDisplay
                      items={model.future}
                      label="Future"
                      color="purple"
                      maxVisible={2}
                    />
                  </td>
                  <td className="p-4">
                    <CompactListDisplay
                      items={model.status}
                      label="Status"
                      color="orange"
                      maxVisible={2}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(model)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(model.Id || model.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {models.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No models found. Create your first model to get started.
            </div>
          )}
        </div>
      </div>

      <ModelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        model={selectedModel}
        streams={streams}
        mode={dialogMode}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs max-w-xs">
          <div>Streams in Models: {streams.length}</div>
          <div>Dialog Open: {dialogOpen ? 'Yes' : 'No'}</div>
          {streams.length > 0 && (
            <div>Sample: {JSON.stringify(streams[0], null, 1)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Models;