import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Company, Executive, ProductionYear, Source } from '../types';
import { getCompanyById, saveCompany, uploadImageFile } from '../services/db';
import { THEME_COLOR } from '../constants';
import WorldMap from './WorldMap';
import ProductionChart from './ProductionChart';
import { Save, Eye, ArrowLeft, Trash2, Plus, Upload, Building2, CheckCircle, Loader2, Link as LinkIcon } from 'lucide-react';

const CompanyEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'executives' | 'contact' | 'map' | 'data'>('executives');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Track specific upload target (e.g., 'logo' or executive ID)
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  
  const isFirstLoad = useRef(true);

  // For data tab preview
  const [activePreviewTab, setActivePreviewTab] = useState<'ebitda' | 'production'>('ebitda');

  useEffect(() => {
    if (id) {
      loadCompany(id);
    }
  }, [id]);

  const loadCompany = async (companyId: string) => {
      try {
          const data = await getCompanyById(companyId);
          if (data) {
              // Backward compatibility for old records without sources arrays or using 'ebdat'
              const fixedData = { ...data };
              if (!fixedData.introSources) fixedData.introSources = [];
              if (!fixedData.financialSources) fixedData.financialSources = [];
              if (!fixedData.locationSources) fixedData.locationSources = [];
              
              // Migrate ebdat to ebitda in local state if needed
              if (fixedData.productionData) {
                  fixedData.productionData = fixedData.productionData.map((pd: any) => ({
                      year: pd.year,
                      production: pd.production,
                      ebitda: pd.ebitda !== undefined ? pd.ebitda : (pd.ebdat || 0)
                  }));
              }
              
              if ((fixedData as any).axisLabelEbdat) {
                 fixedData.axisLabelEbitda = (fixedData as any).axisLabelEbdat;
              }

              // Auto-migrate old labels to new unit
              if (fixedData.axisLabelEbitda === "EBITDA ($M)" || fixedData.axisLabelEbitda === "EBDAT ($M)") {
                  fixedData.axisLabelEbitda = "EBITDA (R Billion)";
              }

              setCompany(fixedData);
          }
      } catch (e) {
          console.error("Failed to load company", e);
      }
  }

  // Autosave Effect
  useEffect(() => {
    if (!company) return;

    // Skip the first render/load to avoid saving initial state immediately
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const performSave = async () => {
      setSaveStatus('saving');
      try {
          await saveCompany(company);
          setSaveStatus('saved');
      } catch (e) {
          console.error("Autosave failed", e);
          setSaveStatus('idle'); // Or error state
      }
    };

    // Debounce slightly 
    const timeoutId = setTimeout(performSave, 1000);

    return () => clearTimeout(timeoutId);
  }, [company]);

  // Helper to extract extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop() || 'png';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && company) {
      setUploadingTarget('logo');
      try {
        const file = e.target.files[0];
        const ext = getFileExtension(file.name);
        // Using timestamp to avoid caching issues
        const url = await uploadImageFile(file, `companies/${company.id}/logo-${Date.now()}.${ext}`);
        setCompany({ ...company, logoUrl: url });
      } catch (err: any) {
        console.error("Error uploading logo", err);
        alert(`Failed to upload logo: ${err.message || err}`);
      } finally {
        setUploadingTarget(null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, execId: string) => {
    if (e.target.files && e.target.files[0] && company) {
      setUploadingTarget(execId);
      try {
        const file = e.target.files[0];
        const ext = getFileExtension(file.name);
        const url = await uploadImageFile(file, `companies/${company.id}/executives/${execId}-${Date.now()}.${ext}`);
        
        const updatedExecs = company.executives.map(ex => 
          ex.id === execId ? { ...ex, imageUrl: url } : ex
        );
        setCompany({ ...company, executives: updatedExecs });
      } catch (err: any) {
        console.error("Error uploading image", err);
        alert(`Failed to upload image: ${err.message || err}`);
      } finally {
        setUploadingTarget(null);
      }
    }
  };

  const updateExecutive = (id: string, field: keyof Executive, value: string) => {
    if (!company) return;
    const updatedExecs = company.executives.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    );
    setCompany({ ...company, executives: updatedExecs });
  };

  const addExecutive = () => {
    if (!company) return;
    const newExec: Executive = {
      id: Math.random().toString(36).substr(2, 9),
      roleTitle: "New Role",
      name: "",
      bio: "",
      education: "",
      imageUrl: null
    };
    setCompany({ ...company, executives: [...company.executives, newExec] });
  };

  const removeExecutive = (id: string) => {
    if (!company) return;
    setCompany({ ...company, executives: company.executives.filter(x => x.id !== id) });
  };

  const updateProductionData = (index: number, field: keyof ProductionYear, value: string) => {
    if (!company) return;
    const updatedData = [...company.productionData];
    updatedData[index] = { ...updatedData[index], [field]: parseFloat(value) || 0 };
    setCompany({ ...company, productionData: updatedData });
  };

  const toggleHighlightCountry = (countryName: string) => {
    if (!company) return;
    const exists = company.highlightedCountries.includes(countryName);
    let newHighlights;
    if (exists) {
      newHighlights = company.highlightedCountries.filter(c => c !== countryName);
    } else {
      newHighlights = [...company.highlightedCountries, countryName];
    }
    setCompany({ ...company, highlightedCountries: newHighlights });
  };

  const handlePinDragEnd = (id: string, lat: number, lng: number) => {
    if (!company) return;
    const updatedLocations = company.locations.map(loc => 
      loc.id === id ? { ...loc, lat, lng } : loc
    );
    setCompany({ ...company, locations: updatedLocations });
  };

  // --- Generic Source Management ---
  const updateSource = (section: 'intro' | 'financial' | 'location', id: string, field: 'label' | 'url', value: string) => {
    if (!company) return;
    const key = `${section}Sources` as keyof Company;
    // @ts-ignore - Typescript struggles with dynamic key access for arrays, but this is safe
    const updatedSources = (company[key] as Source[]).map(src => 
        src.id === id ? { ...src, [field]: value } : src
    );
    setCompany({ ...company, [key]: updatedSources });
  };

  const addSource = (section: 'intro' | 'financial' | 'location') => {
      if (!company) return;
      const key = `${section}Sources` as keyof Company;
      const newSource: Source = { id: Math.random().toString(36).substr(2, 9), label: "New Link", url: "" };
      // @ts-ignore
      setCompany({ ...company, [key]: [...(company[key] as Source[]), newSource] });
  };

  const removeSource = (section: 'intro' | 'financial' | 'location', id: string) => {
      if (!company) return;
      const key = `${section}Sources` as keyof Company;
      // @ts-ignore
      setCompany({ ...company, [key]: (company[key] as Source[]).filter(s => s.id !== id) });
  };

  const renderSourceEditor = (section: 'intro' | 'financial' | 'location', title: string) => {
      if (!company) return null;
      const key = `${section}Sources` as keyof Company;
      const sources = company[key] as Source[] || [];

      return (
          <div className="mt-6 border border-slate-200 rounded-md p-4 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> {title} Sources
              </h3>
              <div className="space-y-3">
                  {sources.map((src) => (
                      <div key={src.id} className="flex gap-2 items-center">
                          <input 
                              type="text" 
                              value={src.label}
                              onChange={(e) => updateSource(section, src.id, 'label', e.target.value)}
                              placeholder="Button Label"
                              className="bg-white text-slate-900 border-slate-300 rounded-md shadow-sm text-sm p-2 border w-1/3 focus:ring-[#37A3C3] focus:border-[#37A3C3]"
                          />
                          <input 
                              type="text" 
                              value={src.url}
                              onChange={(e) => updateSource(section, src.id, 'url', e.target.value)}
                              placeholder="https://..."
                              className="bg-white text-slate-900 border-slate-300 rounded-md shadow-sm text-sm p-2 border flex-1 focus:ring-[#37A3C3] focus:border-[#37A3C3]"
                          />
                          <button 
                              onClick={() => removeSource(section, src.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
                  <button 
                      onClick={() => addSource(section)}
                      className="text-sm text-[#37A3C3] font-medium flex items-center hover:underline mt-2"
                  >
                      <Plus className="w-3 h-3 mr-1" /> Add Source Link
                  </button>
              </div>
          </div>
      );
  };


  if (!company) return <div className="p-8 flex items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Loading data...</div>;

  // Common styles for inputs to ensure white text
  const inputStyle = "mt-1 block w-full bg-slate-800 text-white placeholder-slate-400 border-slate-600 rounded-md shadow-sm focus:ring-[#37A3C3] focus:border-[#37A3C3] sm:text-sm border p-2";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            
            {/* Logo Upload */}
            <div className="relative group w-16 h-16 flex-shrink-0">
                 <div className="w-full h-full rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {uploadingTarget === 'logo' ? (
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : company.logoUrl ? (
                          <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                          <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                 </div>
                 <label className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity font-medium ${uploadingTarget ? 'pointer-events-none' : ''}`}>
                    Upload
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        disabled={uploadingTarget !== null} 
                    />
                 </label>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                   Editing Profile
                   {saveStatus === 'saving' && (
                     <span className="flex items-center text-slate-400">
                       <Loader2 className="w-3 h-3 animate-spin mr-1" /> Saving...
                     </span>
                   )}
                   {saveStatus === 'saved' && (
                     <span className="flex items-center text-[#37A3C3]">
                       <CheckCircle className="w-3 h-3 mr-1" /> Saved
                     </span>
                   )}
                </p>
            </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/preview/${company.id}`)}
            className="flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </button>
          
          <div
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm transition-all"
            style={{ backgroundColor: saveStatus === 'saved' ? '#10b981' : THEME_COLOR, opacity: saveStatus === 'saving' ? 0.8 : 1 }}
          >
            {saveStatus === 'saving' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saveStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
                <Save className="w-4 h-4 mr-2" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All Saved' : 'Autosave On'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['executives', 'contact', 'map', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab 
                  ? `border-[#37A3C3] text-[#37A3C3]` 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab === 'data' ? 'Production Data' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        
        {/* EXECUTIVES TAB */}
        {activeTab === 'executives' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Executive Team</h2>
                <button onClick={addExecutive} className="text-sm flex items-center text-[#37A3C3] font-medium hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> Add Role
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {company.executives.map((exec) => (
                <div key={exec.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50 flex flex-col md:flex-row gap-6 relative group">
                  <button 
                    onClick={() => removeExecutive(exec.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="w-full md:w-1/4 flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md relative flex items-center justify-center">
                       {exec.imageUrl ? (
                           <img src={exec.imageUrl} alt={exec.name} className="w-full h-full object-cover" />
                       ) : (
                           <div className="text-slate-400 text-xs text-center p-2">No Photo</div>
                       )}
                       {uploadingTarget === exec.id && (
                           <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                               <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                           </div>
                       )}
                    </div>
                    <label className={`cursor-pointer text-xs font-medium text-[#37A3C3] hover:underline flex items-center ${uploadingTarget ? 'pointer-events-none opacity-50' : ''}`}>
                        <Upload className="w-3 h-3 mr-1" /> {exec.imageUrl ? 'Change Photo' : 'Upload Photo'}
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, exec.id)} 
                            disabled={uploadingTarget !== null} 
                        />
                    </label>
                  </div>

                  <div className="w-full md:w-3/4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Role Title (Renamable)</label>
                            <input 
                                type="text" 
                                value={exec.roleTitle} 
                                onChange={(e) => updateExecutive(exec.id, 'roleTitle', e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Full Name</label>
                            <input 
                                type="text" 
                                value={exec.name} 
                                onChange={(e) => updateExecutive(exec.id, 'name', e.target.value)}
                                className={inputStyle}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Academic Background</label>
                        <input 
                            type="text" 
                            value={exec.education} 
                            onChange={(e) => updateExecutive(exec.id, 'education', e.target.value)}
                            className={inputStyle}
                            placeholder="e.g. MBA Harvard, BSc Engineering"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Biography</label>
                        <textarea 
                            rows={3}
                            value={exec.bio} 
                            onChange={(e) => updateExecutive(exec.id, 'bio', e.target.value)}
                            className={inputStyle}
                            placeholder="Short professional biography..."
                        />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="space-y-8">
            {/* General Company Info Sources (Intro) */}
             <div>
                <h2 className="text-lg font-medium mb-2">Company Overview & Sources</h2>
                <p className="text-sm text-slate-500">Links appearing in the Intro/Hero section (e.g. Website, Leadership page).</p>
                {renderSourceEditor('intro', 'Intro / Overview')}
            </div>

            <hr className="border-slate-200" />
            
            <div className="max-w-2xl space-y-6">
                <h2 className="text-lg font-medium">South Africa Office Details</h2>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Corporate Address</label>
                    <textarea
                        rows={3}
                        value={company.contact.address}
                        onChange={(e) => setCompany({...company, contact: {...company.contact, address: e.target.value}})}
                        className={inputStyle}
                    />
                </div>
                
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">Email Addresses</label>
                        <button 
                            type="button"
                            onClick={() => setCompany({...company, contact: {...company.contact, emails: [...company.contact.emails, '']}})}
                            className="text-xs text-[#37A3C3] font-medium"
                        >
                            + Add Email
                        </button>
                    </div>
                    {company.contact.emails.map((email, idx) => (
                        <input
                            key={idx}
                            type="email"
                            value={email}
                            onChange={(e) => {
                                const newEmails = [...company.contact.emails];
                                newEmails[idx] = e.target.value;
                                setCompany({...company, contact: {...company.contact, emails: newEmails}});
                            }}
                            className={`mb-2 ${inputStyle}`}
                            placeholder="info@egca.io"
                        />
                    ))}
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">Telephone Numbers</label>
                        <button 
                            type="button"
                            onClick={() => setCompany({...company, contact: {...company.contact, phones: [...company.contact.phones, '']}})}
                            className="text-xs text-[#37A3C3] font-medium"
                        >
                            + Add Phone
                        </button>
                    </div>
                    {company.contact.phones.map((phone, idx) => (
                        <input
                            key={idx}
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                const newPhones = [...company.contact.phones];
                                newPhones[idx] = e.target.value;
                                setCompany({...company, contact: {...company.contact, phones: newPhones}});
                            }}
                            className={`mb-2 ${inputStyle}`}
                            placeholder="+27..."
                        />
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="space-y-6">
             <div className="flex justify-between items-start">
                <div>
                     <h2 className="text-lg font-medium">Global Operations</h2>
                     <p className="text-sm text-slate-500">Click countries on the map to highlight them as operating regions.</p>
                </div>
                <div className="text-sm bg-slate-50 p-2 rounded border">
                    <span className="font-bold">{company.highlightedCountries.length}</span> countries selected
                </div>
             </div>
             
             <WorldMap 
                locations={company.locations} 
                highlightedCountries={company.highlightedCountries} 
                onCountryClick={toggleHighlightCountry}
                onPinDragEnd={handlePinDragEnd}
                editMode={true}
             />
             
             {/* Location Sources */}
             {renderSourceEditor('location', 'Map Data')}

             {/* Simple Pin Manager */}
             <div className="mt-8 border-t pt-6">
                <h3 className="font-medium mb-4">Office Pins (Lat/Long)</h3>
                <div className="space-y-4">
                     {company.locations.map((loc, idx) => (
                         <div key={idx} className="flex gap-2 items-center">
                             <input 
                                value={loc.name}
                                onChange={(e) => {
                                    const locs = [...company.locations];
                                    locs[idx].name = e.target.value;
                                    setCompany({...company, locations: locs});
                                }}
                                placeholder="Office Name"
                                className={`${inputStyle} mt-0 flex-1`}
                             />
                              <input 
                                value={loc.lat}
                                type="number"
                                onChange={(e) => {
                                    const locs = [...company.locations];
                                    locs[idx].lat = parseFloat(e.target.value);
                                    setCompany({...company, locations: locs});
                                }}
                                placeholder="Lat"
                                className={`${inputStyle} mt-0 w-20`}
                             />
                              <input 
                                value={loc.lng}
                                type="number"
                                onChange={(e) => {
                                    const locs = [...company.locations];
                                    locs[idx].lng = parseFloat(e.target.value);
                                    setCompany({...company, locations: locs});
                                }}
                                placeholder="Lng"
                                className={`${inputStyle} mt-0 w-20`}
                             />
                             <button 
                                onClick={() => {
                                    const locs = company.locations.filter((_, i) => i !== idx);
                                    setCompany({...company, locations: locs});
                                }}
                                className="text-red-500 p-1"
                             >
                                 <Trash2 className="w-4 h-4"/>
                             </button>
                         </div>
                     ))}
                     <button 
                        onClick={() => setCompany({...company, locations: [...company.locations, {id: Math.random().toString(), name: 'New Office', lat: 0, lng: 0, type: 'office'}]})}
                        className="text-sm text-[#37A3C3] font-medium"
                    >
                        + Add Location Pin
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Data Entry Column */}
                <div>
                    <h2 className="text-lg font-medium mb-4">Production & EBITDA Data Points</h2>
                    <div className="overflow-x-auto border rounded-lg border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">EBITDA</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Production</th>
                            <th className="px-2 py-3 w-8"></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                        {company.productionData.map((data, idx) => (
                            <tr key={idx}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                <input 
                                    value={data.year}
                                    onChange={(e) => {
                                        const newData = [...company.productionData];
                                        newData[idx].year = e.target.value;
                                        setCompany({...company, productionData: newData});
                                    }}
                                    className="bg-slate-800 text-white border-slate-600 rounded p-1 w-full text-center"
                                />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                <input 
                                    type="number"
                                    value={data.ebitda}
                                    onChange={(e) => updateProductionData(idx, 'ebitda', e.target.value)}
                                    className="bg-slate-800 text-white border-slate-600 rounded p-1 w-full"
                                />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                <input 
                                    type="number"
                                    value={data.production}
                                    onChange={(e) => updateProductionData(idx, 'production', e.target.value)}
                                    className="bg-slate-800 text-white border-slate-600 rounded p-1 w-full"
                                />
                            </td>
                            <td className="px-2 py-3 text-center">
                                <button 
                                    onClick={() => {
                                        const newData = company.productionData.filter((_, i) => i !== idx);
                                        setCompany({...company, productionData: newData});
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                    title="Remove Year"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                    <div className="mt-4">
                         <button 
                            onClick={() => {
                                const lastYear = parseInt(company.productionData[company.productionData.length - 1]?.year || "2020");
                                const newYear = (lastYear + 1).toString();
                                setCompany({...company, productionData: [...company.productionData, { year: newYear, ebitda: 0, production: 0 }]});
                            }}
                            className="text-sm flex items-center text-[#37A3C3] font-medium hover:underline"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Next Year
                        </button>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Chart Axis Labels</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">EBITDA Axis Label</label>
                                <input 
                                    type="text"
                                    value={company.axisLabelEbitda || "EBITDA (R Billion)"}
                                    onChange={(e) => setCompany({...company, axisLabelEbitda: e.target.value})}
                                    className={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Production Axis Label</label>
                                <input 
                                    type="text"
                                    value={company.axisLabelProduction || "Production (Kt)"}
                                    onChange={(e) => setCompany({...company, axisLabelProduction: e.target.value})}
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Sources */}
                    {renderSourceEditor('financial', 'Financial & Production Report')}
                </div>

                {/* Live Preview Column */}
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium">Chart Preview</h2>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setActivePreviewTab('ebitda')}
                                className={`text-xs px-2 py-1 rounded ${activePreviewTab === 'ebitda' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}
                            >
                                EBITDA
                            </button>
                            <button 
                                onClick={() => setActivePreviewTab('production')}
                                className={`text-xs px-2 py-1 rounded ${activePreviewTab === 'production' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}
                            >
                                Production
                            </button>
                        </div>
                     </div>
                     <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 shadow-inner">
                        <ProductionChart 
                            data={company.productionData} 
                            type={activePreviewTab} 
                            axisLabel={activePreviewTab === 'ebitda' ? company.axisLabelEbitda : company.axisLabelProduction}
                        />
                     </div>
                     <p className="text-xs text-slate-400 mt-2 text-center">
                        This is how the chart will appear in the final preview.
                     </p>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CompanyEditor;