import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { THEME_COLOR } from '../constants';
import { Home, Briefcase } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <BrandLogo className="w-10 h-10" />
              <span className="font-bold text-xl tracking-tight text-slate-800">EGCA <span className="font-light text-slate-500">Outreach</span></span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/' 
                    ? `border-[#37A3C3] text-slate-900` 
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
