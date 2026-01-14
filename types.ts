export interface Executive {
  id: string;
  roleTitle: string; // Renamable title (e.g., CEO, Chief Transformation Officer)
  name: string;
  bio: string;
  education: string;
  imageUrl: string | null;
}

export interface ProductionYear {
  year: string;
  ebdat: number;
  production: number;
}

export interface GeoLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'office' | 'operation';
}

export interface ContactDetails {
  address: string;
  emails: string[];
  phones: string[];
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string;
  executives: Executive[];
  contact: ContactDetails;
  locations: GeoLocation[]; // For the map
  productionData: ProductionYear[];
  highlightedCountries: string[]; // ISO codes or names for map highlighting
  axisLabelEbdat?: string;
  axisLabelProduction?: string;
}
