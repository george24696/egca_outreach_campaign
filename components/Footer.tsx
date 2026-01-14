import React from 'react';
import { BrandLogo } from './BrandLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-8 h-8" />
            <span className="font-bold text-slate-700 tracking-tight">EGCA </span>
          </div>
          <p className="text-sm text-slate-500 text-center md:text-right">
            &copy; 2026 EGCA . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
