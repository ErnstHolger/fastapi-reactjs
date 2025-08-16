import React, { useState } from 'react';
import { Button } from './ui/button';
import ThemeToggle from './ThemeToggle';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const PageHeader = ({ title, children }) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    
    try {
      // Test connection by trying to fetch streams
      await axios.get('http://127.0.0.1:8008/connect/streams', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus(null), 3000); // Clear after 3 seconds
    } catch (error) {
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus(null), 5000); // Clear after 5 seconds
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

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {children && <div className="mt-2">{children}</div>}
      </div>
      
      <div className="flex items-center gap-3">
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
  );
};

export default PageHeader;