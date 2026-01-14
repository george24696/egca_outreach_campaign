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
    { year: "2021", ebdat: 10, production: 5 },
    { year: "2022", ebdat: 12, production: 6 },
    { year: "2023", ebdat: 11, production: 5.5 },
    { year: "2024", ebdat: 14, production: 7 },
  ],
  highlightedCountries: [],
  axisLabelEbdat: "EBDAT ($M)",
  axisLabelProduction: "Production (Kt)"
});
