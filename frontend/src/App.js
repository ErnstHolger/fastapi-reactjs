import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TileLayout from './components/TileLayout';
import Configuration from './components/ObjectTable';
import Models from './components/Models';
import ModelTimeSeries from './components/ModelTimeSeries';
import Timeseries from './components/Timeseries';
import PageHeader from './components/PageHeader';
import './utils/suppressWarnings';

function App() {
  const [activeItem, setActiveItem] = useState('home');

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'home':
        return (
          <div className="p-8">
            <PageHeader title="Home">
              <p className="text-muted-foreground">Welcome to the dashboard home page.</p>
            </PageHeader>
          </div>
        );
      case 'tile':
        return <TileLayout />;
      case 'timeseries':
        return <Timeseries />;
      case 'object':
        return <Configuration />;
      case 'models':
        return <Models />;
      case 'model-timeseries':
        return <ModelTimeSeries />;
      case 'about':
        return (
          <div className="p-8">
            <PageHeader title="About">
              <p className="text-muted-foreground">Information about this application.</p>
            </PageHeader>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
