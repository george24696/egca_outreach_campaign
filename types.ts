export interface Source {
  id: string;
  label: string;
  url: string;
}

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
  [key: string]: string | number; // Allow dynamic keys for various charts
}

export interface ChartConfig {
  id: string;
  dataKey: string; // Corresponds to key in ProductionYear
  title: string;
  labelX: string;
  labelY: string;
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
  
  // Dynamic Chart configurations
  charts: ChartConfig[];

  // Legacy fields kept for migration safety
  axisLabelEbitda?: string; 
  axisLabelProduction?: string;

  // Source Links
  introSources: Source[];
  financialSources: Source[];
  locationSources: Source[];
}