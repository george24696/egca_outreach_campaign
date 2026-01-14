import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Company } from '../types';
import { getCompanyById } from '../services/db';
import { THEME_COLOR } from '../constants';
import WorldMap from './WorldMap';
import ProductionChart from './ProductionChart';
import { ArrowLeft, Phone, Mail, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const CompanyPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [activeChartId, setActiveChartId] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadCompany(id);
    }
  }, [id]);

  const loadCompany = async (companyId: string) => {
      try {
          const data = await getCompanyById(companyId);
          if (data) {
              const fixedData = { ...data };

               // Chart Migration for preview
               if (!fixedData.charts || fixedData.charts.length === 0) {
                  let ebitdaLabel = fixedData.axisLabelEbitda || (fixedData as any).axisLabelEbdat || "EBITDA (R Billion)";
                  if (ebitdaLabel.includes('$M')) ebitdaLabel = "EBITDA (R Billion)";
                  
                  const prodLabel = fixedData.axisLabelProduction || "Production (Kt)";
                  
                  fixedData.charts = [
                      { id: 'default-ebitda', dataKey: 'ebitda', title: 'EBITDA', labelX: 'Years', labelY: ebitdaLabel },
                      { id: 'default-production', dataKey: 'production', title: 'Production', labelX: 'Years', labelY: prodLabel }
                  ];
                  
                  // Ensure data has ebitda/production keys
                  if (fixedData.productionData) {
                      fixedData.productionData = fixedData.productionData.map((pd: any) => ({
                          ...pd,
                          ebitda: pd.ebitda !== undefined ? pd.ebitda : (pd.ebdat || 0),
                          production: pd.production !== undefined ? pd.production : 0
                      }));
                  }
              }

              setCompany(fixedData);
              if (fixedData.charts.length > 0) {
                  setActiveChartId(fixedData.charts[0].id);
              }
          }
      } catch (e) {
          console.error("Failed to load company", e);
      }
  }

  if (!company) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>;

  const activeChart = company.charts.find(c => c.id === activeChartId) || company.charts[0];

  return (
    <div className="bg-white font-sans text-slate-900">
      
      {/* Navigation for Back */}
      <div className="bg-slate-900 text-white p-4 no-print sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center hover:text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back to Dashboard
            </Link>
            <span className="font-bold text-lg">{company.name} - Outreach Campaign</span>
            <div className="w-4"></div>
        </div>
      </div>

      {/* Hero / Header Section */}
      <section className="bg-[#0f172a] text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
            {company.logoUrl ? (
                <img src={company.logoUrl} className="h-48 w-48 object-contain opacity-50 grayscale" alt="Logo Watermark" />
            ) : (
                <BrandLogo className="w-64 h-64 opacity-50" color={THEME_COLOR} />
            )}
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-8 w-24 h-24 bg-white/10 rounded-lg p-2 flex items-center justify-center backdrop-blur-sm border border-white/20">
                {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="max-w-full max-h-full object-contain" />
                ) : (
                    <div className="text-4xl font-black text-white">{company.name.charAt(0)}</div>
                )}
            </div>
            
            <h1 className="text-5xl font-bold mb-8">Outreach campaign</h1>
            <div className="flex items-center gap-4 mb-12">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME_COLOR }}></div>
                 <h2 className="text-2xl font-light text-slate-300">Executives details</h2>
            </div>
            
            <p className="max-w-3xl text-lg font-light leading-relaxed text-slate-300 mb-8">
                We tackle complex challenges by recognizing that intricate systems are made up of simpler components. 
                Our solutions are straightforward, delivering a high return on investment upon implementation.
            </p>

            {/* Intro Sources */}
            {company.introSources && company.introSources.length > 0 && (
                <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Sources:</span>
                    {company.introSources.map((source, idx) => (
                        <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            {source.label} <ExternalLink className="w-3 h-3 ml-2 opacity-70" />
                        </a>
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* Executives Section */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-bold text-[#0f172a]">Leadership — <span style={{ color: THEME_COLOR }}>SIPOC model</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {company.executives.map((exec, idx) => (
                <div key={idx} className="flex flex-col h-full border-r border-slate-200 last:border-0 pr-4">
                    <div className="flex justify-center mb-4">
                         <div className="w-32 h-32 rounded-full overflow-hidden border-4 bg-slate-100" style={{ borderColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            {exec.imageUrl ? (
                                <img src={exec.imageUrl} alt={exec.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">Photo</div>
                            )}
                         </div>
                    </div>
                    <div className="text-center mb-6">
                        <span className="px-4 py-1 text-white font-bold text-sm uppercase tracking-wider rounded-sm" style={{ backgroundColor: '#0f172a' }}>
                            {exec.roleTitle}
                        </span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-bold text-[#0f172a] text-lg mb-1">{exec.name}</h3>
                            <p className="text-xs font-bold text-[#37A3C3] uppercase mb-2">Background</p>
                            <p className="text-sm text-slate-600 italic">{exec.education || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#37A3C3] uppercase mb-2">Bio</p>
                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-6 hover:line-clamp-none transition-all">
                                {exec.bio || 'No biography available.'}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <h4 className="font-bold text-[#0f172a] mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" style={{color: THEME_COLOR}} /> Head Office Address</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{company.contact.address || "Address not listed."}</p>
            </div>
            <div>
                <h4 className="font-bold text-[#0f172a] mb-2 flex items-center gap-2"><Mail className="w-4 h-4" style={{color: THEME_COLOR}} /> Contact Emails</h4>
                <ul className="text-sm text-slate-600 space-y-1">{company.contact.emails.map(e => e && <li key={e}>{e}</li>)}</ul>
            </div>
             <div>
                <h4 className="font-bold text-[#0f172a] mb-2 flex items-center gap-2"><Phone className="w-4 h-4" style={{color: THEME_COLOR}} /> Telephone</h4>
                <ul className="text-sm text-slate-600 space-y-1">{company.contact.phones.map(p => p && <li key={p}>{p}</li>)}</ul>
            </div>
        </div>
      </section>

      {/* Dynamic Production Charts Section */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-8">Production & Financial History</h2>
            
            <div className="flex flex-wrap gap-4 mb-8">
                {company.charts.map(chart => (
                    <button 
                        key={chart.id}
                        onClick={() => setActiveChartId(chart.id)}
                        className={`px-6 py-2 rounded-full font-medium transition-colors ${chart.id === activeChart.id ? 'bg-[#37A3C3] text-white' : 'bg-white text-slate-600 border border-slate-300'}`}
                    >
                        {chart.title}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2 shadow-lg rounded-xl overflow-hidden bg-white p-6 border border-slate-100">
                    {activeChart && (
                        <ProductionChart 
                            data={company.productionData} 
                            dataKey={activeChart.dataKey}
                            title={activeChart.title}
                            labelX={activeChart.labelX}
                            labelY={activeChart.labelY}
                        />
                    )}
                </div>
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#0f172a]">Sources</h3>
                    
                    {company.financialSources && company.financialSources.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {company.financialSources.map((source, idx) => (
                                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:border-[#37A3C3] hover:text-[#37A3C3] text-sm font-medium transition-colors">
                                    {source.label} <ExternalLink className="w-3 h-3 ml-2" />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm italic">No sources listed.</p>
                    )}

                    <div className="p-4 bg-white border-l-4 border-[#37A3C3] shadow-sm mt-4">
                        <span className="block text-xs font-bold uppercase text-slate-400">Latest Year ({company.productionData[company.productionData.length - 1]?.year})</span>
                        <span className="text-2xl font-bold text-[#0f172a]">
                           {company.productionData[company.productionData.length - 1]?.[activeChart.dataKey] || 0}
                           <span className="text-sm font-normal text-slate-500 ml-2">({activeChart.labelY})</span>
                        </span>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
         <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0f172a]">Locations where they are operating</h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-2">
                <p className="text-slate-500">Global footprint and strategic operational hubs.</p>
                {company.locationSources && company.locationSources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                         {company.locationSources.map((source, idx) => (
                                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:border-[#37A3C3] hover:text-[#37A3C3] text-xs font-medium transition-colors">
                                    Source: {source.label} <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            ))}
                    </div>
                )}
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
                 <WorldMap locations={company.locations} highlightedCountries={company.highlightedCountries} />
            </div>
            <div className="space-y-6 bg-slate-50 p-6 rounded-xl h-fit">
                <h3 className="font-bold text-[#37A3C3] uppercase tracking-wider text-sm border-b border-slate-200 pb-2">Key Regions</h3>
                {company.highlightedCountries.length > 0 ? (
                    <ul className="space-y-3">
                        {company.highlightedCountries.map(c => (
                            <li key={c} className="flex items-center text-slate-700"><div className="w-2 h-2 rounded-full bg-[#37A3C3] mr-3"></div>{c}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-sm">No regions highlighted.</p>
                )}
                
                {company.locations.length > 0 && (
                     <>
                        <h3 className="font-bold text-[#37A3C3] uppercase tracking-wider text-sm border-b border-slate-200 pb-2 mt-6">Specific Offices</h3>
                        <ul className="space-y-3">
                            {company.locations.map((l, i) => (
                                <li key={i} className="flex items-center text-slate-700 text-sm"><MapPin className="w-3 h-3 text-[#37A3C3] mr-2" />{l.name}</li>
                            ))}
                        </ul>
                     </>
                )}
            </div>
         </div>
      </section>

    </div>
  );
};

export default CompanyPreview;