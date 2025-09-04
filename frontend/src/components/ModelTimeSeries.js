import React, { useState, useEffect, useRef } from 'react';
import PageHeader from './PageHeader';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Button } from './ui/button';
import axios from 'axios';

const ModelTimeSeries = () => {
  const [models, setModels] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [singleAxis, setSingleAxis] = useState(true);
  const [streamData, setStreamData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [dataPointCount, setDataPointCount] = useState(1000);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const modelDropdownRef = useRef(null);

  // Fetch models when component mounts
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8008/connect/models', {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        setModels(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('ModelTimeSeries - Error fetching models:', error);
        setModels([]);
      }
    };

    fetchModels();
  }, []);

  // Fetch streams when component mounts
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8008/connect/streams', {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        setStreams(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('ModelTimeSeries - Error fetching streams:', error);
        setStreams([]);
      }
    };

    fetchStreams();
  }, []);

  // Get time range parameters based on selection
  const getTimeRangeParams = (range) => {
    const now = new Date();
    const rangeConfig = {
      '5min': { minutes: 5, recommendedCount: 100 },
      '10min': { minutes: 10, recommendedCount: 200 },
      '30min': { minutes: 30, recommendedCount: 300 },
      '1h': { minutes: 60, recommendedCount: 600 },
      '8h': { minutes: 8 * 60, recommendedCount: 1000 },
      '24h': { minutes: 24 * 60, recommendedCount: 2000 },
      '1week': { minutes: 7 * 24 * 60, recommendedCount: 5000 }
    };
    
    const config = rangeConfig[range] || rangeConfig['1h'];
    const startTime = new Date(now.getTime() - config.minutes * 60 * 1000);
    
    const params = {
      start: startTime.toISOString(),
      end: now.toISOString(),
      recommendedCount: config.recommendedCount
    };
    
    console.log('ModelTimeSeries - Time range params:', { 
      range, 
      params, 
      durationMinutes: config.minutes,
      durationHours: config.minutes / 60,
      durationDays: config.minutes / (60 * 24)
    });
    return params;
  };

  // Fetch asset values from connect/asset_values endpoint
  const fetchAssetData = async (assetId, timeRange = selectedTimeRange, pointCount = null) => {
    if (!assetId) return { categories: [], data: {} };

    const { start, end, recommendedCount } = getTimeRangeParams(timeRange);
    // Use provided pointCount, or fall back to recommendedCount for time range, or finally dataPointCount
    const count = pointCount || recommendedCount || dataPointCount;
    const data = {};
    const categories = [];

    console.log('ModelTimeSeries - Fetching asset data:', { 
      assetId, 
      timeRange,
      start, 
      end, 
      count 
    });

    try {
      const response = await axios.get('http://127.0.0.1:8008/connect/asset_values', {
        params: { 
          asset_id: assetId, 
          start, 
          end, 
          count
        },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('ModelTimeSeries - API Response:', response.data);

      const streamData = response.data;

      if (streamData && typeof streamData === 'object' && !Array.isArray(streamData)) {
        // Process the response where each key is a stream name and value is array of {timestamp, value} objects
        Object.keys(streamData).forEach(streamKey => {
          const streamValues = streamData[streamKey];
          
          if (Array.isArray(streamValues) && streamValues.length > 0) {
            const values = streamValues.map(item => parseFloat(item.value || 0));
            const timestamps = streamValues.map(item => item.timestamp);
            
            data[streamKey] = values;
            
            // Use timestamps from first stream for categories (x-axis)
            if (categories.length === 0) {
              timestamps.forEach(timestamp => {
                const date = new Date(timestamp);
                categories.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              });
            }
          } else {
            data[streamKey] = [];
          }
        });
      }

      // If no valid data, create empty categories based on time range
      if (categories.length === 0) {
        const numPoints = 20;
        const startTime = new Date(start);
        const endTime = new Date(end);
        const timeStep = (endTime.getTime() - startTime.getTime()) / (numPoints - 1);
        
        for (let i = 0; i < numPoints; i++) {
          const timestamp = new Date(startTime.getTime() + i * timeStep);
          categories.push(timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }

    } catch (error) {
      console.error('ModelTimeSeries - Error fetching asset data:', error);
    }

    return { categories, data };
  };

  // Handle model selection
  const handleModelSelect = (modelId) => {
    setStreamData({ categories: [], data: {} });
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
    
    // Automatically fetch data for the selected model
    if (modelId) {
      fetchAssetData(modelId, selectedTimeRange).then(setStreamData);
    }
  };

  // Handle time range selection change
  const handleTimeRangeChange = (newRange) => {
    console.log('ModelTimeSeries - Time range changed:', { 
      from: selectedTimeRange, 
      to: newRange,
      hasModel: !!selectedModel
    });
    
    setStreamData({ categories: [], data: {} });
    setSelectedTimeRange(newRange);
    if (selectedModel) {
      // Don't pass pointCount so it uses the recommended count for the time range
      fetchAssetData(selectedModel, newRange).then(setStreamData);
    }
  };

  // Handle intervals count change
  const handleCountChange = (newCount) => {
    const count = parseInt(newCount) || 1000;
    setDataPointCount(count);
    setStreamData({ categories: [], data: {} });
    if (selectedModel) {
      fetchAssetData(selectedModel, selectedTimeRange, count).then(setStreamData);
    }
  };

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create dynamic chart configuration based on available data
  const createHighchartsConfig = () => {
    if (!selectedModel || !streamData.categories || Object.keys(streamData.data).length === 0) {
      return {
        title: {
          text: 'Model Asset Data Visualization',
          style: {
            color: darkMode ? '#d1d5db' : '#4b5563',
            fontSize: '18px'
          }
        },
        chart: {
          backgroundColor: 'transparent'
        },
        series: []
      };
    }

    // Color palette for series (same as original timeseries)
    const seriesColors = [
      '#03a9f4', '#ad1457', '#f57f17', '#8bc34a', '#0277bd',
      '#ffc107', '#e91e63', '#607d8b', '#283593', '#ff5722',
      '#00bcd4', '#673ab7', '#f44336', '#795548', '#2196f3',
      '#cddc39', '#9c27b0', '#009688', '#3f51b5', '#37474f',
      '#558b2f', '#d84315', '#00838f'
    ];

    // Get all available streams from the data
    const availableStreams = Object.keys(streamData.data);
    
    // Create series for each available stream
    const series = availableStreams.map((streamKey, index) => {
      // Try to find stream by ID first, then by name, otherwise use the key directly
      const streamObj = streams.find(s => 
        (s.Id || s.id) === streamKey || 
        (s.Name || s.name) === streamKey
      );
      const displayName = streamObj ? (streamObj.Name || streamObj.name || streamKey) : streamKey;
      
      return {
        name: displayName,
        type: 'line',
        data: streamData.data[streamKey] || [],
        color: seriesColors[index % seriesColors.length],
        yAxis: singleAxis ? 0 : index,
        marker: {
          symbol: 'circle',
          radius: 2
        },
        lineWidth: 2
      };
    });

    const selectedModelObj = models.find(m => (m.Id || m.id) === selectedModel);
    const modelName = selectedModelObj ? (selectedModelObj.name || selectedModel) : selectedModel;

    // Create Y axes configuration
    const yAxis = singleAxis 
      ? {
          title: {
            text: 'Values',
            style: { color: darkMode ? '#d1d5db' : '#4b5563' }
          },
          labels: {
            style: { color: darkMode ? '#d1d5db' : '#4b5563', fontSize: '11px' }
          },
          gridLineWidth: 0
        }
      : availableStreams.map((streamKey, index) => {
          const streamObj = streams.find(s => 
            (s.Id || s.id) === streamKey || 
            (s.Name || s.name) === streamKey
          );
          const displayName = streamObj ? (streamObj.Name || streamObj.name || streamKey) : streamKey;
          
          return {
            title: {
              text: displayName,
              style: { color: darkMode ? '#d1d5db' : '#4b5563' }
            },
            labels: {
              style: { color: darkMode ? '#d1d5db' : '#4b5563', fontSize: '11px' }
            },
            opposite: index % 2 === 1,
            offset: Math.floor(index / 2) * 60,
            gridLineWidth: 0
          };
        });

    return {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 600,
        zoomType: 'x'
      },
      navigator: {
        enabled: true,
        series: {
          color: '#667eea',
          fillOpacity: 0.2,
          lineWidth: 2
        }
      },
      scrollbar: {
        enabled: true,
        barBackgroundColor: '#e0e0e0',
        barBorderRadius: 4,
        barBorderWidth: 0,
        buttonBackgroundColor: '#667eea',
        buttonBorderWidth: 0,
        buttonArrowColor: 'white',
        trackBackgroundColor: '#f5f5f5',
        trackBorderWidth: 1,
        trackBorderRadius: 4,
        trackBorderColor: '#e0e0e0'
      },
      title: {
        text: `Model Asset Data - ${modelName}`,
        style: {
          color: darkMode ? '#d1d5db' : '#4b5563',
          fontSize: '18px'
        }
      },
      colors: seriesColors,
      tooltip: {
        shared: true,
        crosshairs: true,
        backgroundColor: darkMode ? '#333333' : '#ffffff',
        borderColor: darkMode ? '#666666' : '#cccccc',
        style: { 
          color: darkMode ? '#d1d5db' : '#4b5563' 
        }
      },
      legend: {
        itemStyle: {
          color: darkMode ? '#d1d5db' : '#4b5563',
          fontSize: '12px'
        },
        itemHoverStyle: {
          color: darkMode ? '#ffffff' : '#000000'
        }
      },
      xAxis: {
        categories: streamData.categories,
        title: {
          text: 'Time',
          style: { color: darkMode ? '#d1d5db' : '#4b5563' }
        },
        labels: {
          style: { color: darkMode ? '#d1d5db' : '#4b5563', fontSize: '11px' }
        },
        lineColor: darkMode ? '#666666' : '#cccccc'
      },
      yAxis: yAxis,
      series: series,
      plotOptions: {
        line: {
          marker: {
            enabled: true,
            radius: 2
          }
        }
      }
    };
  };

  return (
    <div className="p-8">
      <PageHeader title="Model Time Series Dashboard">
        <div className="flex items-center gap-6 mt-4">
          {/* Model Selection Dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <div
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="min-w-[200px] max-w-[300px] px-3 py-2 text-sm border border-border rounded-lg bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-between"
            >
              <div className="flex-1 truncate">
                {selectedModel === '' ? (
                  <span className="text-muted-foreground">Select model...</span>
                ) : (
                  <span>
                    {models.find(m => (m.Id || m.id) === selectedModel)?.name || selectedModel}
                  </span>
                )}
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {modelDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
                <div className="overflow-y-auto max-h-60">
                  {models.length > 0 ? (
                    models.map((model, index) => {
                      const modelId = model.Id || model.id || `model_${index}`;
                      const modelName = model.name || modelId;
                      const isSelected = selectedModel === modelId;
                      
                      return (
                        <div
                          key={`model_${index}_${modelId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelSelect(modelId);
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                            isSelected ? 'bg-primary text-primary-foreground' : ''
                          }`}
                        >
                          <div className="font-medium truncate">{modelName}</div>
                          {model.description && (
                            <div className="text-xs opacity-70 truncate">{model.description}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No models available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Time Range Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="w-24 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="5min">5 min</option>
              <option value="10min">10 min</option>
              <option value="30min">30 min</option>
              <option value="1h">1 hour</option>
              <option value="8h">8 hours</option>
              <option value="24h">24 hours</option>
              <option value="1week">1 week</option>
            </select>
          </div>

          {/* Axis Toggle */}
          <div className="flex gap-2">
            <Button
              variant={singleAxis ? "default" : "outline"}
              size="sm"
              onClick={() => setSingleAxis(true)}
              className="text-xs"
            >
              Single
            </Button>
            <Button
              variant={!singleAxis ? "default" : "outline"}
              size="sm"
              onClick={() => setSingleAxis(false)}
              className="text-xs"
            >
              Multiple
            </Button>
          </div>

          {/* Intervals Count */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Intervals:</label>
            <select
              value={dataPointCount}
              onChange={(e) => handleCountChange(e.target.value)}
              className="w-20 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
              <option value={10000}>10000</option>
            </select>
          </div>
        </div>
      </PageHeader>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <HighchartsReact
          highcharts={Highcharts}
          options={createHighchartsConfig()}
        />
      </div>
    </div>
  );
};

export default ModelTimeSeries;