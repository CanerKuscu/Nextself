"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingService = void 0;
const supabase_1 = require("./supabase");
class RatingService {
    constructor() {
        this.supabaseService = supabase_1.SupabaseService.getInstance();
    }
    static getInstance() {
        if (!RatingService.instance) {
            RatingService.instance = new RatingService();
        }
        return RatingService.instance;
    }
    // Create a rating for a professional
    createRating(rating) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .insert(Object.assign(Object.assign({}, rating), { date: new Date().toISOString() }))
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to create rating: ${error.message}`);
                }
                // Update professional's average rating
                yield this.updateProfessionalRating(rating.professionalId);
                return data;
            }
            catch (error) {
                console.error('Error creating rating:', error);
                throw error;
            }
        });
    }
    // Get ratings for a professional
    getRatingsForProfessional(professionalId_1) {
        return __awaiter(this, arguments, void 0, function* (professionalId, page = 1, limit = 10) {
            try {
                const { data, count, error } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .select('*')
                    .eq('professional_id', professionalId)
                    .order('date', { ascending: false })
                    .range((page - 1) * limit, page * limit - 1);
                if (error) {
                    throw new Error(`Failed to get ratings: ${error.message}`);
                }
                return { data: data || [], count: count || 0 };
            }
            catch (error) {
                console.error('Error getting ratings:', error);
                throw error;
            }
        });
    }
    // Update a rating - SECURITY: requires userId for ownership verification
    updateRating(ratingId, userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only allow updating own ratings
                const { data, error } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .update(updates)
                    .eq('id', ratingId)
                    .eq('user_id', userId)
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to update rating: ${error.message}`);
                }
                if (!data) {
                    throw new Error('Rating not found or you do not have permission to update it');
                }
                if (updates.rating || updates.verified) {
                    yield this.updateProfessionalRating(data.professional_id);
                }
                return data;
            }
            catch (error) {
                console.error('Error updating rating:', error);
                throw error;
            }
        });
    }
    // Delete a rating - SECURITY: requires userId for ownership verification
    deleteRating(ratingId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // IMPORTANT: Get the professional_id BEFORE deleting the rating
                const { data: rating } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .select('professional_id')
                    .eq('id', ratingId)
                    .eq('user_id', userId)
                    .single();
                if (!rating) {
                    throw new Error('Rating not found or you do not have permission to delete it');
                }
                const professionalId = rating.professional_id;
                const { error } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .delete()
                    .eq('id', ratingId)
                    .eq('user_id', userId);
                if (error) {
                    throw new Error(`Failed to delete rating: ${error.message}`);
                }
                // Update the professional's average rating
                if (professionalId) {
                    yield this.updateProfessionalRating(professionalId);
                }
            }
            catch (error) {
                console.error('Error deleting rating:', error);
                throw error;
            }
        });
    }
    // Update professional's average rating
    updateProfessionalRating(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all ratings for this professional
                const { data: ratings } = yield this.supabaseService.getClient()
                    .from('ratings')
                    .select('rating')
                    .eq('professional_id', professionalId);
                if (!ratings || ratings.length === 0) {
                    return;
                }
                // Calculate average rating
                const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
                // Update professional profile
                yield this.supabaseService.getClient()
                    .from('professional_profiles')
                    .update({
                    updated_at: new Date().toISOString(),
                    average_rating: averageRating,
                    total_ratings: ratings.length,
                })
                    .eq('professional_id', professionalId);
            }
            catch (error) {
                console.error('Error updating professional rating:', error);
            }
        });
    }
    // Search professionals with filters
    searchProfessionals(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, page = 1, limit = 20) {
            var _a;
            try {
                let query = this.supabaseService.getClient()
                    .from('professional_profiles')
                    .select('*');
                // Apply filters
                if (filters.professionalType && filters.professionalType !== 'all') {
                    query = query.eq('professional_type', filters.professionalType);
                }
                if ((_a = filters.location) === null || _a === void 0 ? void 0 : _a.city) {
                    query = query.eq('location->>city', filters.location.city);
                }
                if (filters.rating) {
                    query = query.gte('average_rating', filters.rating);
                }
                if (filters.priceRange) {
                    query = query
                        .gte('pricing->>sessionRate', filters.priceRange.min)
                        .lte('pricing->>sessionRate', filters.priceRange.max);
                }
                if (filters.verified !== undefined) {
                    query = query.eq('is_verified', filters.verified);
                }
                if (filters.availability !== undefined) {
                    // Check if professional has any availability
                    query = query.or(`availability->monday.eq.${filters.availability},availability->tuesday.eq.${filters.availability},availability->wednesday.eq.${filters.availability},availability->thursday.eq.${filters.availability},availability->friday.eq.${filters.availability},availability->saturday.eq.${filters.availability},availability->sunday.eq.${filters.availability}`);
                }
                // Order and paginate
                query = query
                    .order('average_rating', { ascending: false })
                    .range((page - 1) * limit, page * limit - 1);
                const { data, count, error } = yield query;
                if (error) {
                    throw new Error(`Failed to search professionals: ${error.message}`);
                }
                return { data: data || [], count: count || 0 };
            }
            catch (error) {
                console.error('Error searching professionals:', error);
                throw error;
            }
        });
    }
    // Location-based search
    searchProfessionalsByLocation(search_1, filters_1) {
        return __awaiter(this, arguments, void 0, function* (search, filters, page = 1, limit = 20) {
            try {
                let query = this.supabaseService.getClient()
                    .from('professional_profiles')
                    .select('*');
                // Apply basic filters first
                if (filters.professionalType && filters.professionalType !== 'all') {
                    query = query.eq('professional_type', filters.professionalType);
                }
                // Get all professionals and filter by location in the application
                const { data: allProfessionals } = yield query;
                if (!allProfessionals) {
                    return { data: [], count: 0 };
                }
                // Filter by distance from user location
                let filteredProfessionals = allProfessionals.filter(professional => {
                    if (!professional.location.latitude || !professional.location.longitude) {
                        return false;
                    }
                    const distance = this.calculateDistance(search.userLocation.latitude, search.userLocation.longitude, professional.location.latitude, professional.location.longitude);
                    return distance <= search.searchRadius;
                });
                // Apply additional filters
                if (filters.rating !== undefined) {
                    filteredProfessionals = filteredProfessionals.filter(p => p.averageRating >= filters.rating);
                }
                if (filters.priceRange && filters.priceRange.min !== undefined && filters.priceRange.max !== undefined) {
                    filteredProfessionals = filteredProfessionals.filter(p => p.pricing.sessionRate >= filters.priceRange.min &&
                        p.pricing.sessionRate <= filters.priceRange.max);
                }
                // Sort by the specified criteria
                filteredProfessionals.sort((a, b) => {
                    switch (search.sortBy) {
                        case 'distance':
                            const distanceA = this.calculateDistance(search.userLocation.latitude, search.userLocation.longitude, a.location.latitude, a.location.longitude);
                            const distanceB = this.calculateDistance(search.userLocation.latitude, search.userLocation.longitude, b.location.latitude, b.location.longitude);
                            return distanceA - distanceB;
                        case 'rating':
                            return b.averageRating - a.averageRating;
                        case 'price':
                            return a.pricing.sessionRate - b.pricing.sessionRate;
                        case 'experience':
                            return b.experience - a.experience;
                        default:
                            return 0;
                    }
                });
                // Paginate results
                const startIndex = (page - 1) * limit;
                const paginatedData = filteredProfessionals.slice(startIndex, startIndex + limit);
                return { data: paginatedData, count: filteredProfessionals.length };
            }
            catch (error) {
                console.error('Error searching professionals by location:', error);
                throw error;
            }
        });
    }
    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    // Get professional profile by ID
    getProfessionalProfile(professionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.supabaseService.getClient()
                    .from('professional_profiles')
                    .select('*')
                    .eq('professional_id', professionalId)
                    .single();
                if (error) {
                    throw new Error(`Failed to get professional profile: ${error.message}`);
                }
                return data;
            }
            catch (error) {
                console.error('Error getting professional profile:', error);
                throw error;
            }
        });
    }
    // Update professional profile
    updateProfessionalProfile(professionalId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.supabaseService.getClient()
                    .from('professional_profiles')
                    .update(Object.assign(Object.assign({}, updates), { updated_at: new Date().toISOString() }))
                    .eq('professional_id', professionalId)
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to update professional profile: ${error.message}`);
                }
                return data;
            }
            catch (error) {
                console.error('Error updating professional profile:', error);
                throw error;
            }
        });
    }
    // Get client relationships for a professional
    getClientRelationships(professionalId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = this.supabaseService.getClient()
                    .from('client_relationships')
                    .select('*')
                    .eq('professional_id', professionalId)
                    .order('created_at', { ascending: false });
                if (status) {
                    query = query.eq('status', status);
                }
                const { data, error } = yield query;
                if (error) {
                    throw new Error(`Failed to get client relationships: ${error.message}`);
                }
                return data || [];
            }
            catch (error) {
                console.error('Error getting client relationships:', error);
                throw error;
            }
        });
    }
    // Create client relationship
    createClientRelationship(relationship) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, error } = yield this.supabaseService.getClient()
                    .from('client_relationships')
                    .insert(Object.assign(Object.assign({}, relationship), { status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }))
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to create client relationship: ${error.message}`);
                }
                return data;
            }
            catch (error) {
                console.error('Error creating client relationship:', error);
                throw error;
            }
        });
    }
    // Update client relationship status
    updateClientRelationshipStatus(relationshipId, status, endDate, commissionAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updates = {
                    status,
                    updated_at: new Date().toISOString(),
                };
                if (endDate) {
                    updates.end_date = endDate;
                }
                if (commissionAmount !== undefined) {
                    updates.commission_amount = commissionAmount;
                    updates.commission_paid = true;
                }
                const { data, error } = yield this.supabaseService.getClient()
                    .from('client_relationships')
                    .update(updates)
                    .eq('id', relationshipId)
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to update client relationship: ${error.message}`);
                }
                return data;
            }
            catch (error) {
                console.error('Error updating client relationship:', error);
                throw error;
            }
        });
    }
    // Get top-rated professionals in a location
    getTopRatedProfessionals(city_1, professionalType_1) {
        return __awaiter(this, arguments, void 0, function* (city, professionalType, limit = 10) {
            try {
                let query = this.supabaseService.getClient()
                    .from('professional_profiles')
                    .select('*')
                    .eq('location->>city', city)
                    .eq('is_active', true)
                    .order('average_rating', { ascending: false })
                    .limit(limit);
                if (professionalType) {
                    query = query.eq('professional_type', professionalType);
                }
                const { data, error } = yield query;
                if (error) {
                    throw new Error(`Failed to get top-rated professionals: ${error.message}`);
                }
                return data || [];
            }
            catch (error) {
                console.error('Error getting top-rated professionals:', error);
                throw error;
            }
        });
    }
}
exports.RatingService = RatingService;
