import React, { useState, useEffect, useRef } from 'react';
import PageHeader from './PageHeader';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Button } from './ui/button';
import axios from 'axios';

const Timeseries = () => {
  const [streams, setStreams] = useState([]);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [singleAxis, setSingleAxis] = useState(true);
  const [streamData, setStreamData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [dataPointCount, setDataPointCount] = useState(1000);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);

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
        console.error('Timeseries - Error fetching streams:', error);
        setStreams([]);
      }
    };

    fetchStreams();
  }, []);

  // Get time range parameters based on selection
  const getTimeRangeParams = (range) => {
    const now = new Date();
    const rangeConfig = {
      '5min': { minutes: 5 },
      '10min': { minutes: 10 },
      '30min': { minutes: 30 },
      '1h': { minutes: 60 },
      '8h': { minutes: 8 * 60 },
      '24h': { minutes: 24 * 60 },
      '1week': { minutes: 7 * 24 * 60 }
    };

    const config = rangeConfig[range] || rangeConfig['1h'];
    const startTime = new Date(now.getTime() - config.minutes * 60 * 1000);

    return {
      start: startTime.toISOString(),
      end: now.toISOString()
    };
  };

  // Fetch stream data from connect/stream_sample_values endpoint
  const fetchStreamData = async (streamIds) => {
    if (streamIds.length === 0) return { categories: [], data: {} };

    const { start, end } = getTimeRangeParams(selectedTimeRange);
    return await fetchStreamDataInternal(streamIds, start, end, dataPointCount);
  };

  // Fetch stream data with specific range
  const fetchStreamDataWithRange = async (streamIds, timeRange, customIntervals = null) => {
    if (streamIds.length === 0) return { categories: [], data: {} };

    const { start, end } = getTimeRangeParams(timeRange);
    const intervals = customIntervals || dataPointCount;
    return await fetchStreamDataInternal(streamIds, start, end, intervals);
  };

  // Internal function to fetch stream data
  const fetchStreamDataInternal = async (streamIds, start, end, intervals) => {
    const data = {};
    const categories = [];

    try {
      // Fetch data for all selected streams
      const promises = streamIds.map(async (streamId) => {
        try {
          const response = await axios.get('http://127.0.0.1:8008/connect/stream_sample_values', {
            params: { stream_id: streamId, start, end, intervals },
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });
          return { streamId, data: response.data };
        } catch (error) {
          console.error(`Timeseries - Error fetching data for stream ${streamId}:`, error);
          return { streamId, data: [] };
        }
      });

      const results = await Promise.all(promises);

      // Process the results
      results.forEach(({ streamId, data: streamValues }) => {
        if (Array.isArray(streamValues) && streamValues.length > 0) {
          // Assuming stream_values returns array of [timestamp, value] pairs or objects with timestamp/value
          const values = streamValues.map(item => {
            if (Array.isArray(item)) return parseFloat(item[1]) || 0;
            return parseFloat(item.value || item.Value || 0);
          });

          const timestamps = streamValues.map(item => {
            if (Array.isArray(item)) return item[0];
            return item.timestamp || item.Timestamp || new Date().toISOString();
          });

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

      // If no valid data, create empty categories based on time range
      if (categories.length === 0) {
        const numPoints = 20; // Default number of points if no data
        const startTime = new Date(start);
        const endTime = new Date(end);
        const timeStep = (endTime.getTime() - startTime.getTime()) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
          const timestamp = new Date(startTime.getTime() + i * timeStep);
          categories.push(timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }

    } catch (error) {
      console.error('Timeseries - Error fetching stream data:', error);
    }

    return { categories, data };
  };

  // Handle time range selection change
  const handleTimeRangeChange = (newRange) => {
    // Clear current data immediately
    setStreamData({ categories: [], data: {} });

    setSelectedTimeRange(newRange);
    if (selectedStreams.length > 0) {
      // Create a modified fetchStreamData that uses the new range
      fetchStreamDataWithRange(selectedStreams, newRange).then(setStreamData);
    }
  };

  // Handle intervals count change
  const handleCountChange = (newCount) => {
    const count = parseInt(newCount) || 1000;
    setDataPointCount(count);

    // Clear current data and refetch if streams are selected
    setStreamData({ categories: [], data: {} });
    if (selectedStreams.length > 0) {
      fetchStreamData(selectedStreams).then(setStreamData);
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
    // Clear current data immediately
    setStreamData({ categories: [], data: {} });

    setSelectedStreams(prev => {
      const newSelection = prev.includes(streamId)
        ? prev.filter(id => id !== streamId)
        : [...prev, streamId];

      // Update stream data when selection changes
      if (newSelection.length > 0) {
        fetchStreamData(newSelection).then(setStreamData);
      }

      return newSelection;
    });
  };

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create dynamic chart configuration based on selected streams
  const createHighchartsConfig = () => {
    if (selectedStreams.length === 0 || !streamData.categories) {
      return {
        title: {
          text: 'Stream Data Visualization',
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

    // Color palette for series
    const seriesColors = [
      '#03a9f4', '#ad1457', '#f57f17', '#8bc34a', '#0277bd',
      '#ffc107', '#e91e63', '#607d8b', '#283593', '#ff5722',
      '#00bcd4', '#673ab7', '#f44336', '#795548', '#2196f3',
      '#cddc39', '#9c27b0', '#009688', '#3f51b5', '#37474f',
      '#558b2f', '#d84315', '#00838f'
    ];

    // Create series for each selected stream
    const series = selectedStreams.map((streamId, index) => {
      // Find the stream object to get the proper name
      const streamObj = streams.find(s => (s.Id || s.id) === streamId);
      const displayName = streamObj ? (streamObj.Name || streamObj.name || streamId) : streamId;

      return {
        name: displayName,
        type: 'line',
        data: streamData.data[streamId] || [],
        color: seriesColors[index % seriesColors.length],
        yAxis: singleAxis ? 0 : index,
        marker: {
          symbol: 'circle',
          radius: 2
        },
        lineWidth: 2
      };
    });

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
      : selectedStreams.map((streamId, index) => {
          // Find the stream object to get the proper name for Y-axis
          const streamObj = streams.find(s => (s.Id || s.id) === streamId);
          const displayName = streamObj ? (streamObj.Name || streamObj.name || streamId) : streamId;

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
        text: 'Stream Data Visualization',
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
      <PageHeader title="Time Series Dashboard">
        <div className="flex items-center gap-6 mt-4">
          {/* Searchable Stream Selection Dropdown */}
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
                          className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${isSelected ? 'bg-primary text-primary-foreground' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{streamName}</div>
                            {streamDesc && (
                              <div className={`text-xs truncate ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>{streamDesc}</div>
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

export default Timeseries;