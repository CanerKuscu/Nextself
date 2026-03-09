import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiPlus, FiFilter, FiMapPin, FiDollarSign, FiStar, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const ServiceListing = () => {
    const { t } = useTranslation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('rating'); // rating, price_low, price_high, city
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        city: '',
        inclusions: '',
        image_url: '',
        category: 'training', // training, consultation, package
        duration: '',
        max_participants: '',
    });

    // Mock data for demonstration
    const mockServices = [
        {
            id: '1',
            title: 'Personal Training - Strength & Conditioning',
            description: 'One-on-one personal training sessions focused on strength building and conditioning. Customized workout plans and nutrition guidance.',
            price: 750,
            city: 'Istanbul',
            inclusions: ['Custom workout plan', 'Nutrition guide', 'Weekly check-ins', 'Progress tracking'],
            image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
            category: 'training',
            duration: '60 minutes',
            max_participants: 1,
            rating: 4.8,
            review_count: 42,
            professional_name: 'Ahmet Yılmaz',
            professional_type: 'PT',
        },
        {
            id: '2',
            title: 'Diet Consultation & Meal Planning',
            description: 'Comprehensive diet analysis and personalized meal plans tailored to your health goals and dietary restrictions.',
            price: 500,
            city: 'Ankara',
            inclusions: ['Initial assessment', 'Weekly meal plans', 'Recipe eBook', 'Email support'],
            image_url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af',
            category: 'consultation',
            duration: '45 minutes',
            max_participants: 1,
            rating: 4.9,
            review_count: 37,
            professional_name: 'Zeynep Kaya',
            professional_type: 'Dietitian',
        },
        {
            id: '3',
            title: 'Group Fitness Bootcamp',
            description: 'High-intensity group workouts in outdoor parks. Suitable for all fitness levels. Fun and motivating atmosphere.',
            price: 300,
            city: 'Izmir',
            inclusions: ['Equipment provided', 'Water & towels', 'Warm-up & cool-down', 'Monthly challenge'],
            image_url: 'https://images.unsplash.com/photo-1549060279-7e168fce7090',
            category: 'training',
            duration: '90 minutes',
            max_participants: 15,
            rating: 4.6,
            review_count: 28,
            professional_name: 'Can Demir',
            professional_type: 'PT',
        },
        {
            id: '4',
            title: 'Corporate Wellness Workshop',
            description: 'On-site wellness workshops for companies. Topics include ergonomics, stress management, and healthy eating.',
            price: 2000,
            city: 'Istanbul',
            inclusions: ['Custom workshop content', 'Handouts & materials', 'Follow-up survey', 'Discount for employees'],
            image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
            category: 'package',
            duration: '3 hours',
            max_participants: 30,
            rating: 4.7,
            review_count: 15,
            professional_name: 'Selin Öztürk',
            professional_type: 'Dietitian',
        },
        {
            id: '5',
            title: 'Online Nutrition Coaching',
            description: 'Virtual nutrition coaching via video calls. Flexible scheduling and continuous support through our app.',
            price: 400,
            city: 'Antalya',
            inclusions: ['Weekly video calls', 'Food diary review', 'Custom recipes', '24/7 chat support'],
            image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f',
            category: 'consultation',
            duration: '50 minutes',
            max_participants: 1,
            rating: 4.5,
            review_count: 21,
            professional_name: 'Mehmet Şahin',
            professional_type: 'Dietitian',
        },
    ];

    useEffect(() => {
        // In a real app, fetch from Supabase
        // fetchServices();
        setServices(mockServices);
        const uniqueCities = [...new Set(mockServices.map(s => s.city))];
        setCities(uniqueCities);
        setLoading(false);
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) { throw error; }
            setServices(data || []);
        } catch (err) {
            console.error('Failed to fetch services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        let filtered = [...mockServices];
        if (selectedCity) {
            filtered = filtered.filter(s => s.city.toLowerCase().includes(selectedCity.toLowerCase()));
        }
        if (minPrice) {
            filtered = filtered.filter(s => s.price >= Number(minPrice));
        }
        if (maxPrice) {
            filtered = filtered.filter(s => s.price <= Number(maxPrice));
        }
        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'price_low':
                    return a.price - b.price;
                case 'price_high':
                    return b.price - a.price;
                case 'city':
                    return a.city.localeCompare(b.city);
                default:
                    return 0;
            }
        });
        setServices(filtered);
    };

    useEffect(() => {
        handleFilter();
    }, [selectedCity, minPrice, maxPrice, sortBy]);

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            title: service.title,
            description: service.description,
            price: service.price,
            city: service.city,
            inclusions: service.inclusions.join(', '),
            image_url: service.image_url,
            category: service.category,
            duration: service.duration,
            max_participants: service.max_participants,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) { return; }
        // await supabase.from('services').delete().eq('id', id);
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Simulate save
        const newService = {
            id: editingService ? editingService.id : String(services.length + 1),
            ...formData,
            price: Number(formData.price),
            inclusions: formData.inclusions.split(',').map(s => s.trim()),
            rating: 4.5,
            review_count: 0,
            professional_name: 'Current User',
            professional_type: 'PT',
        };
        if (editingService) {
            setServices(prev => prev.map(s => s.id === editingService.id ? newService : s));
        } else {
            setServices(prev => [newService, ...prev]);
        }
        setShowModal(false);
        setEditingService(null);
        setFormData({
            title: '',
            description: '',
            price: '',
            city: '',
            inclusions: '',
            image_url: '',
            category: 'training',
            duration: '',
            max_participants: '',
        });
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                    <FiStar
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Service & Training Listings</h1>
                    <p className="text-gray-600">Manage and promote your face‑to‑face services</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <FiPlus className="mr-2" /> Add New Service
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">All Cities</option>
                            {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₺)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₺)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="10000"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="rating">Highest Rating</option>
                            <option value="price_low">Price Low‑High</option>
                            <option value="price_high">Price High‑Low</option>
                            <option value="city">City A‑Z</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleFilter}
                        className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                    >
                        <FiFilter className="mr-2" /> Apply Filters
                    </button>
                </div>
            </div>

            {/* Services Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading services...</p>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No services found</h3>
                    <p className="text-gray-600">Try adjusting your filters or create a new service.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div key={service.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={service.image_url}
                                    alt={service.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.category === 'training' ? 'bg-blue-100 text-blue-800' : service.category === 'consultation' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {service.category}
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800">
                                        ₺{service.price}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">{service.title}</h3>
                                    {renderStars(service.rating)}
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                                <div className="flex items-center text-gray-500 text-sm mb-3">
                                    <FiMapPin className="mr-1" /> {service.city}
                                </div>
                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                    <FiDollarSign className="mr-1" /> {service.duration} • max {service.max_participants} participant(s)
                                </div>
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Included:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {service.inclusions.map((inc, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                {inc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="font-medium">{service.professional_name}</span>
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${service.professional_type === 'PT' ? 'bg-orange-100 text-orange-800' : 'bg-teal-100 text-teal-800'}`}>
                                            {service.professional_type}
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(service)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <FiTrash2 />
                                        </button>
                                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                            <FiEye />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for adding/editing */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">{editingService ? 'Edit Service' : 'Create New Service'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                        <textarea
                                            rows={3}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺) *</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="training">Training</option>
                                            <option value="consultation">Consultation</option>
                                            <option value="package">Package</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 60 minutes"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions (comma separated) *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Custom workout plan, Nutrition guide, Weekly check-ins"
                                            value={formData.inclusions}
                                            onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingService(null);
                                        }}
                                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        {editingService ? 'Update Service' : 'Create Service'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceListing;