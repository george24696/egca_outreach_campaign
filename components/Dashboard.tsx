import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Company } from '../types';
import { getCompanies, addCompany } from '../services/db';
import { Plus, Building2, ChevronRight, Edit2, Loader2 } from 'lucide-react';
import { THEME_COLOR } from '../constants';

const Dashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to load companies", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsLoading(true); // Show loading state briefly while creating
    try {
        const newCompany = await addCompany(newName);
        setCompanies([...companies, newCompany]);
        setNewName('');
        setIsAdding(false);
    } catch (e) {
        console.error("Error adding company", e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Overview</h1>
          <p className="mt-1 text-slate-500">Manage outreach campaigns and company profiles.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: THEME_COLOR }}
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Company
            </button>
        </div>
      </div>
      
      {isAdding && (
        <div className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200 animate-fade-in">
          <form onSubmit={handleAddCompany} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                New Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="block w-full rounded-md bg-slate-800 text-white border-slate-600 shadow-sm focus:border-[#37A3C3] focus:ring-[#37A3C3] sm:text-sm p-2 border placeholder-slate-400"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm disabled:opacity-50"
              style={{ backgroundColor: THEME_COLOR }}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
      ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} className="bg-white overflow-hidden shadow rounded-lg border border-slate-100 hover:shadow-md transition-shadow group relative">
                {/* Main Card Content Clickable to Preview */}
                <Link to={`/preview/${company.id}`} className="block p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-slate-100 rounded-md p-3 border border-slate-200">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="h-6 w-6 object-contain" />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-slate-900 truncate group-hover:text-[#37A3C3] transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {company.locations.length} Offices Defined
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Footer with Edit Link */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                  <div className="text-sm flex justify-between items-center">
                    <Link
                      to={`/company/${company.id}`}
                      className="font-medium hover:underline flex items-center text-slate-500 hover:text-[#37A3C3]"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Link>
                    <Link
                      to={`/preview/${company.id}`}
                      className="font-medium text-[#37A3C3] hover:text-[#2d87a3] flex items-center"
                    >
                      Preview <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default Dashboard;