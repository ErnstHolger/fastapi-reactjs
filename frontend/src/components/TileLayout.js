import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ReactECharts from 'echarts-for-react';
import PageHeader from './PageHeader';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const TileCard = ({ title, children, className = "" }) => (
  <div className={`bg-card border border-border rounded-lg h-full ${className}`}>
    {title && <h3 className="text-lg font-semibold p-4 pb-2 text-foreground">{title}</h3>}
    <div className={`${title ? 'p-4 pt-2' : 'p-2'} h-full`} style={{ height: title ? 'calc(100% - 60px)' : '100%' }}>
      {children}
    </div>
  </div>
);

const TileLayout = () => {
  
  // Default color palette matching timeseries
  const chartColors = [
    '#03a9f4', '#ad1457', '#f57f17', '#8bc34a', '#0277bd',
    '#ffc107', '#e91e63', '#607d8b', '#283593', '#ff5722',
    '#00bcd4', '#673ab7', '#f44336', '#795548', '#2196f3',
    '#cddc39', '#9c27b0', '#009688', '#3f51b5', '#37474f',
    '#558b2f', '#d84315', '#00838f'
  ];
  
  const defaultLayout = [
    { i: 'tile1', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'tile2', x: 2, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'tile3', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'tile4', x: 2, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'tile5', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'tile6', x: 2, y: 8, w: 2, h: 4, minW: 2, minH: 3 },
  ];

  const onLayoutChange = (layout, layouts) => {
    // Layout change handler - could save layouts to localStorage or state management
    console.log('Layout changed:', layouts);
  };

  const barChartOption = {
    title: { text: 'Sales Performance', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    tooltip: { trigger: 'axis' },
    legend: { data: ['Q1', 'Q2'], bottom: 5, textStyle: { fontSize: 10 } },
    grid: { top: 40, left: 30, right: 20, bottom: 35 },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: 'Q1', type: 'bar', data: [120, 200, 150, 80, 70, 110] },
      { name: 'Q2', type: 'bar', data: [150, 170, 180, 90, 85, 130] }
    ]
  };

  const lineChartOption = {
    title: { text: 'User Growth', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    tooltip: { trigger: 'axis' },
    legend: { data: ['New Users', 'Active Users'], bottom: 5, textStyle: { fontSize: 10 } },
    grid: { top: 40, left: 35, right: 20, bottom: 35 },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: 'New Users', type: 'line', data: [820, 932, 901, 934, 1290, 1330, 1320] },
      { name: 'Active Users', type: 'line', data: [720, 832, 801, 834, 1190, 1230, 1220] }
    ]
  };

  const pieChartOption = {
    title: { text: 'Market Share', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 5, data: ['Mobile', 'Desktop', 'Tablet'], textStyle: { fontSize: 10 } },
    series: [
      {
        name: 'Traffic Source',
        type: 'pie',
        radius: ['25%', '60%'],
        center: ['50%', '50%'],
        top: 30,
        data: [
          { value: 335, name: 'Mobile' },
          { value: 310, name: 'Desktop' },
          { value: 234, name: 'Tablet' }
        ]
      }
    ]
  };

  const scatterChartOption = {
    title: { text: 'Revenue vs Users', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    tooltip: { trigger: 'item', formatter: 'Users: {c[0]}<br/>Revenue: {c[1]}' },
    grid: { top: 40, left: 45, right: 20, bottom: 40 },
    xAxis: { type: 'value', name: 'Users', nameLocation: 'middle', nameGap: 20, axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
    yAxis: { type: 'value', name: 'Revenue', nameLocation: 'middle', nameGap: 30, axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 10 } },
    series: [
      {
        type: 'scatter',
        data: [
          [100, 2400], [150, 3200], [200, 4100], [250, 5200], [300, 6800],
          [180, 3800], [220, 4500], [280, 6200], [320, 7100], [350, 8000]
        ]
      }
    ]
  };

  const areaChartOption = {
    title: { text: 'Traffic Trends', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    tooltip: { trigger: 'axis' },
    legend: { data: ['Organic', 'Paid', 'Social'], bottom: 5, textStyle: { fontSize: 10 } },
    grid: { top: 40, left: 35, right: 20, bottom: 35 },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: 'Organic', type: 'line', areaStyle: {}, data: [320, 332, 301, 334, 390, 330] },
      { name: 'Paid', type: 'line', areaStyle: {}, data: [220, 182, 191, 234, 290, 330] },
      { name: 'Social', type: 'line', areaStyle: {}, data: [150, 232, 201, 154, 190, 330] }
    ]
  };

  const gaugeChartOption = {
    title: { text: 'Performance Score', left: 'center', textStyle: { fontSize: 12 }, top: 10 },
    color: chartColors,
    series: [
      {
        name: 'Score',
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '70%',
        detail: { formatter: '{value}%', fontSize: 16 },
        data: [{ value: 85, name: 'Performance' }]
      }
    ]
  };

  return (
    <div className="p-6">
      <PageHeader title="ECharts Dashboard Examples">
        <p className="text-muted-foreground">
          Drag and resize chart tiles to customize your layout
        </p>
      </PageHeader>
      
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: defaultLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={120}
        onLayoutChange={onLayoutChange}
        isDraggable={true}
        isResizable={true}
        resizeHandles={['se', 'sw', 'nw', 'ne', 's', 'n', 'w', 'e']}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        <div key="tile1">
          <TileCard title="">
            <ReactECharts 
              option={barChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
        
        <div key="tile2">
          <TileCard title="">
            <ReactECharts 
              option={lineChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
        
        <div key="tile3">
          <TileCard title="">
            <ReactECharts 
              option={pieChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
        
        <div key="tile4">
          <TileCard title="">
            <ReactECharts 
              option={scatterChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
        
        <div key="tile5">
          <TileCard title="">
            <ReactECharts 
              option={areaChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
        
        <div key="tile6">
          <TileCard title="">
            <ReactECharts 
              option={gaugeChartOption} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </TileCard>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default TileLayout;