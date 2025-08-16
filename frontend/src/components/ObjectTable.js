import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ThemeToggle from './ThemeToggle';

export default function Configuration() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEndpoint, setSelectedEndpoint] = useState('streams');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const itemsPerPage = 20;

  const endpoints = useMemo(() => [
    { value: 'types', label: 'Types', url: 'connect/types' },
    { value: 'streams', label: 'Streams', url: 'connect/streams' },
    { value: 'asset_types', label: 'Asset Types', url: 'connect/asset_types' },
    { value: 'assets', label: 'Assets', url: 'connect/assets' }
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentEndpoint = endpoints.find(ep => ep.value === selectedEndpoint);
        const response = await axios.get(`http://127.0.0.1:8008/${currentEndpoint.url}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to help with debugging
          timeout: 10000
        });
        setData(response.data);
        setError(null);
        setCurrentPage(1); // Reset to first page when endpoint changes
        setExpandedRows(new Set()); // Reset expanded rows when endpoint changes
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
          setError(`Cannot connect to API server at http://127.0.0.1:8008. Please ensure the backend server is running.`);
        } else if (err.code === 'ERR_CORS') {
          setError(`CORS error: The backend server needs to allow requests from this domain. Add CORS headers to the FastAPI server.`);
        } else {
          setError(`Failed to fetch data: ${err.message}`);
        }
        console.error('ObjectTable.js - Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEndpoint, endpoints]);

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    
    try {
      await axios.get(`http://127.0.0.1:8008/connect/streams`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus(null), 3000);
    } catch (error) {
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus(null), 5000);
    } finally {
      setTesting(false);
    }
  };

  const getConnectionIcon = () => {
    if (testing) return <Loader2 size={16} className="animate-spin" />;
    if (connectionStatus === 'success') return <Wifi size={16} className="text-green-600" />;
    if (connectionStatus === 'error') return <WifiOff size={16} className="text-red-600" />;
    return <Wifi size={16} />;
  };

  const getConnectionText = () => {
    if (testing) return 'Testing...';
    if (connectionStatus === 'success') return 'Connected';
    if (connectionStatus === 'error') return 'Failed';
    return 'Test Connection';
  };

  const getConnectionColor = () => {
    if (connectionStatus === 'success') return 'text-green-600 border-green-600 hover:bg-green-50';
    if (connectionStatus === 'error') return 'text-red-600 border-red-600 hover:bg-red-50';
    return '';
  };

  const currentEndpoint = endpoints.find(ep => ep.value === selectedEndpoint);

  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const isObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const renderNestedObject = (obj, depth = 0) => {
    return Object.entries(obj).map(([key, value]) => (
      <div key={key} className={`flex ${depth > 0 ? 'ml-4' : ''}`}>
        <div className="min-w-0 flex-1 py-1">
          <span className="text-sm font-medium text-muted-foreground">{key}:</span>{' '}
          <span className="text-sm text-foreground">
            {isObject(value) ? '[Object]' : String(value)}
          </span>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Configuration</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Configuration</h1>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-destructive font-medium">Error</div>
          <div className="text-sm text-destructive/80 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  const renderTable = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      );
    }

    const keys = Object.keys(data[0]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    // Check if any row has nested objects
    const hasNestedObjects = currentData.some(item => 
      keys.some(key => isObject(item[key]))
    );

    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {hasNestedObjects && <th className="px-4 py-3 w-10"></th>}
                {keys.map((key) => (
                  <th key={key} className="px-6 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card">
              {currentData.map((item, index) => {
                const rowId = `${startIndex + index}`;
                const isExpanded = expandedRows.has(rowId);
                const hasNestedData = keys.some(key => isObject(item[key]));
                
                return (
                  <React.Fragment key={rowId}>
                    <tr className="hover:bg-muted/50 border-b border-border">
                      {hasNestedObjects && (
                        <td className="px-4 py-4 w-10">
                          {hasNestedData && (
                            <button
                              onClick={() => toggleRowExpansion(rowId)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      )}
                      {keys.map((key) => (
                        <td key={key} className="px-6 py-4 text-sm text-foreground">
                          {isObject(item[key]) 
                            ? <span className="text-muted-foreground italic">[Object - click to expand]</span>
                            : <span className="whitespace-nowrap">{String(item[key] ?? '')}</span>
                          }
                        </td>
                      ))}
                    </tr>
                    {isExpanded && hasNestedData && (
                      <tr className="bg-muted/20">
                        <td colSpan={hasNestedObjects ? keys.length + 1 : keys.length} className="px-6 py-4">
                          <div className="space-y-2">
                            {keys.map((key) => {
                              if (isObject(item[key])) {
                                return (
                                  <div key={key} className="border-l-2 border-primary/30 pl-4">
                                    <div className="text-sm font-medium text-foreground mb-2">{key}:</div>
                                    <div className="bg-card rounded p-3 border border-border">
                                      {renderNestedObject(item[key])}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (!data || data.length <= itemsPerPage) return null;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} items
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-sm border rounded ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Data from {currentEndpoint.label.toLowerCase()} endpoint ({data.length} items)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select endpoint" />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map((endpoint) => (
                  <SelectItem key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={testing}
              className={`flex items-center gap-2 ${getConnectionColor()}`}
            >
              {getConnectionIcon()}
              {getConnectionText()}
            </Button>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
      {renderTable()}
      {renderPagination()}
    </div>
  );
}