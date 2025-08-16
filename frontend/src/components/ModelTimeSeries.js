import React, { useState, useEffect, useRef } from 'react';
import PageHeader from './PageHeader';
import ReactECharts from 'echarts-for-react';
import { Button } from './ui/button';
import axios from 'axios';

const ModelTimeSeries = () => {
  const [models, setModels] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [singleAxis, setSingleAxis] = useState(true);
  const [streamData, setStreamData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [dataPointCount, setDataPointCount] = useState(1000);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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
  const fetchAssetData = async (assetId, streamIds, timeRange = selectedTimeRange, pointCount = null) => {
    if (!assetId || streamIds.length === 0) return { categories: [], data: {} };

    const { start, end, recommendedCount } = getTimeRangeParams(timeRange);
    // Use provided pointCount, or fall back to recommendedCount for time range, or finally dataPointCount
    const count = pointCount || recommendedCount || dataPointCount;
    const data = {};
    const categories = [];

    console.log('ModelTimeSeries - Fetching asset data:', { 
      assetId, 
      streamIds, 
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
          count,
          stream: streamIds
        },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('ModelTimeSeries - API Response:', response.data);

      const assetValues = response.data;

      if (Array.isArray(assetValues) && assetValues.length > 0) {
        // Process the asset values response
        streamIds.forEach(streamId => {
          const streamValues = assetValues.filter(item => item.stream_id === streamId);
          
          if (streamValues.length > 0) {
            const values = streamValues.map(item => parseFloat(item.value || 0));
            const timestamps = streamValues.map(item => item.timestamp);
            
            data[streamId] = values;
            
            // Use timestamps from first stream for categories (x-axis)
            if (categories.length === 0) {
              timestamps.forEach(timestamp => {
                const date = new Date(timestamp);
                categories.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              });
            }
          } else {
            data[streamId] = [];
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
    setSelectedStreams([]);
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
  };

  // Handle time range selection change
  const handleTimeRangeChange = (newRange) => {
    console.log('ModelTimeSeries - Time range changed:', { 
      from: selectedTimeRange, 
      to: newRange,
      hasModel: !!selectedModel,
      streamCount: selectedStreams.length
    });
    
    setStreamData({ categories: [], data: {} });
    setSelectedTimeRange(newRange);
    if (selectedModel && selectedStreams.length > 0) {
      // Don't pass pointCount so it uses the recommended count for the time range
      fetchAssetData(selectedModel, selectedStreams, newRange).then(setStreamData);
    }
  };

  // Handle intervals count change
  const handleCountChange = (newCount) => {
    const count = parseInt(newCount) || 1000;
    setDataPointCount(count);
    setStreamData({ categories: [], data: {} });
    if (selectedModel && selectedStreams.length > 0) {
      fetchAssetData(selectedModel, selectedStreams, selectedTimeRange, count).then(setStreamData);
    }
  };

  // Filter streams based on search term
  const filteredStreams = streams.filter(stream => {
    const streamId = stream.Id || stream.id || '';
    const streamName = stream.Name || stream.name || '';
    const streamDesc = stream.Description || stream.description || '';
    const searchLower = searchTerm.toLowerCase();
    
    return streamId.toLowerCase().includes(searchLower) || 
           streamName.toLowerCase().includes(searchLower) || 
           streamDesc.toLowerCase().includes(searchLower);
  });

  // Handle stream selection from dropdown
  const handleStreamSelect = (streamId) => {
    setStreamData({ categories: [], data: {} });
    
    setSelectedStreams(prev => {
      const newSelection = prev.includes(streamId)
        ? prev.filter(id => id !== streamId)
        : [...prev, streamId];
      
      if (selectedModel && newSelection.length > 0) {
        // Use recommended count for current time range
        fetchAssetData(selectedModel, newSelection, selectedTimeRange).then(setStreamData);
      }
      
      return newSelection;
    });
  };

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create dynamic chart configuration based on selected streams
  const createTimeSeriesOption = () => {
    if (!selectedModel || selectedStreams.length === 0 || !streamData.categories) {
      return {
        title: { text: 'Model Asset Data Visualization', left: 'center', textStyle: { fontSize: 18 } }
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

    // Create series for each selected stream
    const series = selectedStreams.map((streamId, index) => {
      const streamObj = streams.find(s => (s.Id || s.id) === streamId);
      const displayName = streamObj ? (streamObj.Name || streamObj.name || streamId) : streamId;
      
      return {
        name: displayName,
        type: 'line',
        data: streamData.data[streamId] || [],
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { 
          width: 2,
          color: seriesColors[index % seriesColors.length]
        },
        itemStyle: {
          color: seriesColors[index % seriesColors.length]
        },
        yAxisIndex: singleAxis ? 0 : index
      };
    });

    // Create Y axes configuration
    const yAxis = singleAxis 
      ? {
          type: 'value',
          axisLabel: { fontSize: 11 },
          name: 'Values',
          nameLocation: 'middle',
          nameGap: 40,
          splitLine: { show: false }
        }
      : selectedStreams.map((streamId, index) => {
          const streamObj = streams.find(s => (s.Id || s.id) === streamId);
          const displayName = streamObj ? (streamObj.Name || streamObj.name || streamId) : streamId;
          
          return {
            type: 'value',
            axisLabel: { fontSize: 11 },
            name: displayName,
            nameLocation: 'middle',
            nameGap: 40,
            position: index % 2 === 0 ? 'left' : 'right',
            offset: Math.floor(index / 2) * 60,
            splitLine: { show: false }
          };
        });

    const selectedModelObj = models.find(m => (m.Id || m.id) === selectedModel);
    const modelName = selectedModelObj ? (selectedModelObj.name || selectedModel) : selectedModel;

    return {
      title: { text: `Model Asset Data - ${modelName}`, left: 'center', textStyle: { fontSize: 18 } },
      color: seriesColors,
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: { 
        data: selectedStreams.map(streamId => {
          const streamObj = streams.find(s => (s.Id || s.id) === streamId);
          return streamObj ? (streamObj.Name || streamObj.name || streamId) : streamId;
        }),
        top: 40,
        textStyle: { fontSize: 12 }
      },
      grid: { 
        top: 120, 
        left: singleAxis ? 60 : 100, 
        right: singleAxis ? 60 : 100, 
        bottom: 80,
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: streamData.categories,
        axisLabel: { fontSize: 11 },
        name: 'Time',
        nameLocation: 'middle',
        nameGap: 25
      },
      yAxis: yAxis,
      series: series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          height: 30,
          bottom: 15
        }
      ]
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

          {/* Stream Selection Dropdown - Only show if model is selected */}
          {selectedModel && (
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="min-w-[300px] max-w-[500px] px-3 py-2 text-sm border border-border rounded-lg bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-between"
              >
                <div className="flex-1 truncate">
                  {selectedStreams.length === 0 ? (
                    <span className="text-muted-foreground">Select streams...</span>
                  ) : (
                    <span>
                      {selectedStreams.length === 1 
                        ? streams.find(s => (s.Id || s.id) === selectedStreams[0])?.Name || selectedStreams[0]
                        : `${selectedStreams.length} streams selected`
                      }
                    </span>
                  )}
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      placeholder="Search streams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Stream Options */}
                  <div className="overflow-y-auto max-h-60">
                    {filteredStreams.length > 0 ? (
                      filteredStreams.map((stream, index) => {
                        const streamId = stream.Id || stream.id || `stream_${index}`;
                        const streamName = stream.Name || stream.name || streamId;
                        const streamDesc = stream.Description || stream.description || '';
                        const isSelected = selectedStreams.includes(streamId);
                        
                        return (
                          <div
                            key={`stream_${index}_${streamId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStreamSelect(streamId);
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
                              isSelected ? 'bg-primary text-primary-foreground' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{streamName}</div>
                              {streamDesc && (
                                <div className="text-xs opacity-70 truncate">{streamDesc}</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {searchTerm ? 'No streams found' : 'Loading streams...'}
                      </div>
                    )}
                  </div>

                  {/* Selected Count */}
                  {selectedStreams.length > 0 && (
                    <div className="p-2 border-t border-border bg-muted">
                      <span className="text-xs text-muted-foreground">
                        {selectedStreams.length} stream{selectedStreams.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['5min', '10min', '30min', '1h', '8h', '24h', '1week'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`flex flex-col items-center p-2 rounded-lg border transition-colors w-16 ${
                  selectedTimeRange === range 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-accent hover:text-accent-foreground border-border'
                }`}
              >
                <svg 
                  className="w-4 h-4 mb-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span className="text-xs">{range}</span>
              </button>
            ))}
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
        <ReactECharts 
          option={createTimeSeriesOption()}
          style={{ height: '600px', width: '100%' }}
          opts={{ 
            renderer: 'svg',
            useDirtyRect: false,
            useCoarsePointer: false
          }}
        />
      </div>
    </div>
  );
};

export default ModelTimeSeries;