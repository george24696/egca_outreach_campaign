import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProductionYear } from '../types';

interface ProductionChartProps {
  data: ProductionYear[];
  type: 'ebitda' | 'production';
  axisLabel?: string;
}

const ProductionChart: React.FC<ProductionChartProps> = ({ data, type, axisLabel }) => {
  const dataKey = type;
  const color = "#37A3C3";
  const defaultLabel = type === 'ebitda' ? 'EBITDA ($M)' : 'Production (Kt)';
  const displayLabel = axisLabel || defaultLabel;

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    
    let labelText = `${value}`;
    
    // Calculate percentage change if not the first item
    if (index > 0) {
        // Safe access for ebitda or production based on dataKey
        const prevVal = data[index - 1][dataKey as keyof ProductionYear];
        
        // Check if prevVal exists and is not zero to avoid division by zero
        if (typeof prevVal === 'number' && prevVal !== 0) {
            const change = ((Number(value) - prevVal) / prevVal) * 100;
            const sign = change > 0 ? "+" : "";
            // Format to 0 decimals if whole number (e.g. 20%), otherwise 1 decimal (e.g. 20.5%)
            const formattedChange = change.toFixed(1).replace('.0', '');
            labelText = `${value} (${sign}${formattedChange}%)`;
        }
    }

    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#64748b" 
        textAnchor="middle" 
        fontSize={11} 
        fontWeight="600"
      >
        {labelText}
      </text>
    );
  };

  return (
    <div className="h-96 w-full bg-white p-4 rounded-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-700 uppercase shrink-0">{displayLabel} - History</h3>
      </div>
      
      {/* 
        Container for Chart:
        - min-h-0 is crucial for flex child to not overflow parent height.
        - relative ensures absolute positioning context if needed.
        - h-full takes remaining space from flex parent.
      */}
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 30, // Increased top margin to fit text labels
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                label={{ value: 'Years', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                tick={{ fill: '#64748b' }}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                label={{ value: displayLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12, style: { textAnchor: 'middle' } }}
                tick={{ fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f1f5f9'}}
            />
            <Bar 
                dataKey={dataKey} 
                fill={color} 
                radius={[4, 4, 0, 0]} 
                barSize={50} 
                name={displayLabel}
                label={renderCustomBarLabel}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductionChart;