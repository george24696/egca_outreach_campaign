import React, { useState, useEffect, useMemo } from 'react';
import { Company } from '../types';
import { getCompanies } from '../services/db';
import { Loader2, TrendingUp, BarChart3, Filter, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { THEME_COLOR } from '../constants';

const COLORS = [
  '#37A3C3', '#0f172a', '#f59e0b', '#10b981', '#ef4444', 
  '#8b5cf6', '#ec4899', '#6366f1', '#84cc16', '#14b8a6'
];

const ComparisonDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for controls
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
      // Default selection: Select all companies
      setSelectedCompanyIds(new Set(data.map(c => c.id)));
      
      // Default metric: Try to find 'EBITDA' or first available
      const allMetrics = new Set<string>();
      data.forEach(c => c.charts?.forEach(chart => allMetrics.add(chart.title)));
      
      if (allMetrics.has('EBITDA')) {
        setSelectedMetric('EBITDA');
      } else if (allMetrics.size > 0) {
        setSelectedMetric(Array.from(allMetrics)[0]);
      }

    } catch (error) {
      console.error("Failed to load companies", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Extract all unique chart titles (Metrics) available across companies
  const availableMetrics = useMemo(() => {
    const metrics = new Set<string>();
    companies.forEach(c => {
      c.charts?.forEach(chart => metrics.add(chart.title));
    });
    return Array.from(metrics).sort();
  }, [companies]);

  // 2. Prepare Data for Line Chart (Historical Trend)
  const lineChartData = useMemo(() => {
    if (!selectedMetric) return [];

    // Find all years across selected companies that have this metric
    const allYears = new Set<string>();
    
    companies.forEach(c => {
        // Only process if company is selected
        if (!selectedCompanyIds.has(c.id)) return;

        // Does this company have the selected metric?
        const chartConfig = c.charts?.find(chart => chart.title === selectedMetric);
        if (chartConfig) {
            c.productionData.forEach(pd => allYears.add(pd.year));
        }
    });

    const sortedYears = Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b));

    // Construct data points
    return sortedYears.map(year => {
        const point: any = { year };
        companies.forEach(c => {
            if (!selectedCompanyIds.has(c.id)) return;
            
            const chartConfig = c.charts?.find(chart => chart.title === selectedMetric);
            if (chartConfig) {
                const yearData = c.productionData.find(pd => pd.year === year);
                if (yearData) {
                    point[c.name] = yearData[chartConfig.dataKey];
                }
            }
        });
        return point;
    });

  }, [companies, selectedMetric, selectedCompanyIds]);

  // 3. Prepare Data for Bar Chart (Latest Year Snapshot)
  const barChartData = useMemo(() => {
      if (!selectedMetric) return [];

      const data: any[] = [];
      companies.forEach(c => {
          if (!selectedCompanyIds.has(c.id)) return;

          const chartConfig = c.charts?.find(chart => chart.title === selectedMetric);
          if (chartConfig && c.productionData.length > 0) {
              // Get latest year
              const sortedData = [...c.productionData].sort((a,b) => parseInt(b.year) - parseInt(a.year));
              const latest = sortedData[0];
              
              if (latest && latest[chartConfig.dataKey] !== undefined) {
                  data.push({
                      name: c.name,
                      value: latest[chartConfig.dataKey],
                      year: latest.year
                  });
              }
          }
      });
      return data.sort((a, b) => b.value - a.value); // Sort highest to lowest
  }, [companies, selectedMetric, selectedCompanyIds]);

  const toggleCompany = (id: string) => {
    const newSet = new Set(selectedCompanyIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedCompanyIds(newSet);
  };

  const toggleAll = () => {
    if (selectedCompanyIds.size === companies.length) {
        setSelectedCompanyIds(new Set());
    } else {
        setSelectedCompanyIds(new Set(companies.map(c => c.id)));
    }
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4"/>
            <p>Gathering financial data...</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Industry Comparison</h1>
        <p className="mt-1 text-slate-500">Compare financial and production metrics across the portfolio.</p>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-lg shadow-sm">
        <div className="flex items-start">
            <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
                <p className="text-sm text-amber-700">
                    <span className="font-bold block mb-1">Important Note on Data Consistency</span>
                    Figures are plotted exactly as reported. Different companies may use different currencies (e.g., <strong>US$</strong> vs <strong>ZAR</strong>) or units (e.g., <strong>Millions</strong> vs <strong>Billions</strong>). Consequently, these plots may not be perfectly to scale or directly comparable. For precise context, please refer to the specific unit labels on each company's individual profile page.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Controls Sidebar */}
        <div className="space-y-6">
            
            {/* Metric Selector */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" /> Select Metric
                </h3>
                <div className="space-y-2">
                    {availableMetrics.length === 0 && <p className="text-sm text-slate-400">No chart data available yet.</p>}
                    {availableMetrics.map(metric => (
                        <button
                            key={metric}
                            onClick={() => setSelectedMetric(metric)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedMetric === metric ? 'bg-[#37A3C3] text-white font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                            {metric}
                        </button>
                    ))}
                </div>
            </div>

            {/* Company Filter */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                        <Filter className="w-4 h-4 mr-2" /> Companies
                    </h3>
                    <button onClick={toggleAll} className="text-xs text-[#37A3C3] hover:underline">
                        {selectedCompanyIds.size === companies.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {companies.map(company => (
                        <label key={company.id} className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-slate-50 rounded">
                            <input 
                                type="checkbox" 
                                checked={selectedCompanyIds.has(company.id)}
                                onChange={() => toggleCompany(company.id)}
                                className="h-4 w-4 text-[#37A3C3] focus:ring-[#37A3C3] border-slate-300 rounded"
                            />
                            <span className="text-sm text-slate-700 truncate">{company.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* Charts Area */}
        <div className="lg:col-span-3 space-y-8">
            
            {/* 1. Historical Trend Line Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-[#37A3C3]" />
                            {selectedMetric} - Historical Trend
                        </h2>
                        <p className="text-sm text-slate-500">Comparing performance over available years.</p>
                    </div>
                </div>

                <div className="h-96 w-full">
                    {lineChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{paddingTop: '20px'}} />
                                {companies.map((company, index) => (
                                    selectedCompanyIds.has(company.id) && (
                                        <Line 
                                            key={company.id}
                                            type="monotone" 
                                            dataKey={company.name} 
                                            stroke={COLORS[index % COLORS.length]} 
                                            strokeWidth={2}
                                            dot={{r: 4}}
                                            activeDot={{r: 6}}
                                            connectNulls={true}
                                        />
                                    )
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            No data available for the selected metric and companies.
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Latest Snapshot Bar Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        Latest Reported {selectedMetric}
                    </h2>
                    <p className="text-sm text-slate-500">Ranking based on the most recent year of data available for each company.</p>
                </div>

                <div className="h-96 w-full">
                    {barChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={150} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#334155', fontSize: 12, fontWeight: 500}} 
                                />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-2 border border-slate-100 shadow-lg rounded text-xs">
                                                <p className="font-bold">{data.name}</p>
                                                <p className="text-slate-600">Value: <span className="font-mono font-bold">{data.value}</span></p>
                                                <p className="text-slate-400 italic">Year: {data.year}</p>
                                            </div>
                                        );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" fill={THEME_COLOR} radius={[0, 4, 4, 0]} barSize={24}>
                                    {
                                        barChartData.map((entry, index) => {
                                            // Try to match color from line chart logic for consistency
                                            const compIndex = companies.findIndex(c => c.name === entry.name);
                                            return <cell key={`cell-${index}`} fill={COLORS[compIndex % COLORS.length] || THEME_COLOR} />;
                                        })
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            No data available.
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ComparisonDashboard;