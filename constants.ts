import { Company } from './types';

export const THEME_COLOR = '#37A3C3';

export const INITIAL_COMPANIES_LIST = [
  "Exxaro Resources",
  "Sibanye Stillwater",
  "Gold Fields",
  "African Rainbow Minerals",
  "AngloGold Ashanti",
  "Pan African Resources",
  "Glencore",
  "Ivanhoe Mines",
  "De Beers",
  "Barrick Gold",
  "Eskom",
  "PRASA",
  "Transnet",
  "Telkom"
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const DEFAULT_EXECUTIVE_ROLES = [
  "Chief Executive Officer",
  "Chief Financial Officer",
  "Chief Operating Officer",
  "Chief Transformation Officer"
];

export const createEmptyCompany = (name: string): Company => ({
  id: generateId(),
  name,
  logoUrl: null,
  description: "Enter a brief company description...",
  executives: DEFAULT_EXECUTIVE_ROLES.map(role => ({
    id: generateId(),
    roleTitle: role,
    name: "",
    bio: "",
    education: "",
    imageUrl: null
  })),
  contact: {
    address: "",
    emails: [""],
    phones: [""]
  },
  locations: [],
  productionData: [
    { year: "2021", ebitda: 10, production: 5 },
    { year: "2022", ebitda: 12, production: 6 },
    { year: "2023", ebitda: 11, production: 5.5 },
    { year: "2024", ebitda: 14, production: 7 },
  ],
  highlightedCountries: [],
  axisLabelEbitda: "EBITDA ($M)",
  axisLabelProduction: "Production (Kt)",
  
  // Default Sources
  introSources: [
    { id: generateId(), label: "Company Website", url: "" },
    { id: generateId(), label: "Leadership", url: "" },
    { id: generateId(), label: "Contact Details", url: "" }
  ],
  financialSources: [
    { id: generateId(), label: "2024 Financial Report", url: "" },
    { id: generateId(), label: "2024 Production Report", url: "" }
  ],
  locationSources: [
    { id: generateId(), label: "Operations Map", url: "" }
  ]
});