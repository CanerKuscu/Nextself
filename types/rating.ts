export interface Rating {
  id: string;
  userId: string;
  professionalId: string;
  professionalType: 'trainer' | 'dietitian';
  rating: number; // 1-5 stars
  review: string;
  date: string;
  verified: boolean; // If the user actually worked with this professional
  location?: {
    city: string;
    district?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  helpfulCount: number;
  response?: {
    text: string;
    date: string;
  };
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  professionalType: 'trainer' | 'dietitian';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio: string;
  specialties: string[];
  experience: number; // years
  certifications: string[];
  location: {
    city: string;
    district?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  pricing: {
    consultationFee: number;
    monthlyPackage: number;
    sessionRate: number;
  };
  languages: string[];
  isVerified: boolean;
  averageRating: number;
  totalRatings: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRelationship {
  id: string;
  clientId: string;
  professionalId: string;
  professionalType: 'trainer' | 'dietitian';
  status: 'pending' | 'active' | 'ended';
  startDate: string;
  endDate?: string;
  commissionPaid: boolean;
  commissionAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalSearchFilters {
  professionalType?: 'trainer' | 'dietitian' | 'all';
  location?: {
    city: string;
    district?: string;
    radius?: number; // in km
  };
  specialties?: string[];
  rating?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  verified?: boolean;
  language?: string;
}

export interface LocationBasedSearch {
  userLocation: {
    latitude: number;
    longitude: number;
    city: string;
    district?: string;
  };
  searchRadius: number; // in km
  sortBy: 'distance' | 'rating' | 'price' | 'experience';
}
