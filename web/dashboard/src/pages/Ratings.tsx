import React, { useState, useEffect } from 'react';
import { FiStar, FiUser, FiCalendar, FiMessageSquare, FiFilter, FiChevronDown } from 'react-icons/fi';
import { db } from '../lib/supabase';

const Ratings = () => {
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [filter, setFilter] = useState('all'); // all, pt, dietitian

    useEffect(() => {
        fetchRatings();
    }, [filter]);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockRatings = [
                { id: 1, clientName: 'Ahmet Yılmaz', professionalType: 'pt', rating: 5, comment: 'Çok profesyonel ve motive edici!', date: '2026-02-15', city: 'İstanbul' },
                { id: 2, clientName: 'Zeynep Kaya', professionalType: 'dietitian', rating: 4, comment: 'Beslenme planı harika, sonuçları gördüm.', date: '2026-02-18', city: 'Ankara' },
                { id: 3, clientName: 'Mehmet Demir', professionalType: 'pt', rating: 5, comment: 'Antrenmanlar çok etkili, tavsiye ederim.', date: '2026-02-20', city: 'İzmir' },
                { id: 4, clientName: 'Elif Şahin', professionalType: 'dietitian', rating: 3, comment: 'İyi ama biraz daha kişiselleştirilebilirdi.', date: '2026-02-22', city: 'Bursa' },
                { id: 5, clientName: 'Can Öztürk', professionalType: 'pt', rating: 5, comment: 'Mükemmel bir eğitmen, hedeflerime ulaştım.', date: '2026-02-25', city: 'Antalya' },
            ];
            let filtered = mockRatings;
            if (filter !== 'all') {
                filtered = mockRatings.filter(r => r.professionalType === filter);
            }
            setRatings(filtered);
            const avg = filtered.reduce((sum, r) => sum + r.rating, 0) / (filtered.length || 1);
            setAverageRating(avg);
            setTotalReviews(filtered.length);
        } catch (err: any) {
            console.error('Failed to load ratings:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FiStar key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    const getProfessionalTypeBadge = (type) => {
        const map = {
            pt: { label: 'Personal Trainer', color: 'bg-blue-100 text-blue-800' },
            dietitian: { label: 'Diyetisyen', color: 'bg-green-100 text-green-800' }
        };
        const info = map[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Yıldız ve Yorumlar</h1>
                <p className="text-gray-600">PT ve diyetisyenlerin aldığı değerlendirmeleri görüntüleyin.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                            <FiStar className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ortalama Puan</p>
                            <p className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                            <div className="flex mt-1">
                                {renderStars(Math.round(averageRating))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg mr-4">
                            <FiMessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Toplam Yorum</p>
                            <p className="text-2xl font-bold text-gray-800">{totalReviews}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-50 rounded-lg mr-4">
                            <FiUser className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Filtre</p>
                            <div className="flex items-center mt-1">
                                <select
                                    className="border rounded-lg px-3 py-1 text-sm"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">Tümü</option>
                                    <option value="pt">Personal Trainer</option>
                                    <option value="dietitian">Diyetisyen</option>
                                </select>
                                <FiFilter className="ml-2 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratings Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Son Yorumlar</h2>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                        Yeni Değerlendirme Ekle
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                        <p className="text-gray-600">Yorumlar yükleniyor...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Müşteri</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Uzman</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Puan</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Yorum</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Şehir</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {ratings.map((rating) => (
                                    <tr key={rating.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {rating.clientName.charAt(0)}
                                                </div>
                                                <span className="ml-3 font-medium">{rating.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getProfessionalTypeBadge(rating.professionalType)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                {renderStars(rating.rating)}
                                                <span className="ml-2 font-bold">{rating.rating}.0</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 max-w-xs">{rating.comment}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                                {rating.city}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{rating.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 text-sm text-gray-500">
                <p>Bu sayfa PT ve diyetisyenlerin aldığı yıldız ve yorumları göstermektedir. Gerçek veriler için Supabase entegrasyonu yapılmalıdır.</p>
            </div>
        </div>
    );
};

export default Ratings;