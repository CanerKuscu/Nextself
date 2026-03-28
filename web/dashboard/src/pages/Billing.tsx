import { useState, useEffect } from 'react';
import { FiDollarSign, FiDownload, FiEye, FiCalendar, FiTrendingUp } from 'react-icons/fi';
type InvoiceStatus = 'paid' | 'pending' | 'overdue';

const Billing = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockInvoices = [
                { id: 1, clientName: 'Ahmet Yılmaz', date: '2026-02-15', amount: 299, status: 'paid', type: 'PT Session' },
                { id: 2, clientName: 'Zeynep Kaya', date: '2026-02-18', amount: 150, status: 'pending', type: 'Diet Plan' },
                { id: 3, clientName: 'Mehmet Demir', date: '2026-02-20', amount: 450, status: 'paid', type: 'Package (10 Sessions)' },
                { id: 4, clientName: 'Elif Şahin', date: '2026-02-22', amount: 200, status: 'overdue', type: 'Consultation' },
                { id: 5, clientName: 'Can Öztürk', date: '2026-02-25', amount: 350, status: 'paid', type: 'Fitness Assessment' },
            ];
            setInvoices(mockInvoices);
            const total = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const pending = mockInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
            setTotalRevenue(total);
            setPendingAmount(pending);
        } catch (err: any) {
            console.error('Failed to load billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: InvoiceStatus) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: InvoiceStatus) => {
        switch (status) {
            case 'paid': return 'Ödendi';
            case 'pending': return 'Bekliyor';
            case 'overdue': return 'Gecikmiş';
            default: return status;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Fatura Yönetimi</h1>
                <p className="text-gray-600">PT ve diyetisyen hizmetleriniz için faturaları görüntüleyin ve yönetin.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg mr-4">
                            <FiDollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Toplam Gelir</p>
                            <p className="text-2xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                            <FiCalendar className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Bekleyen Ödeme</p>
                            <p className="text-2xl font-bold text-gray-800">${pendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-50 rounded-lg mr-4">
                            <FiTrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Aktif Faturalar</p>
                            <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Son Faturalar</h2>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                        <FiDownload className="mr-2" /> Fatura Oluştur
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                        <p className="text-gray-600">Faturalar yükleniyor...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Fatura No</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Müşteri</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Tarih</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Tutar</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Durum</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Tür</th>
                                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">#{invoice.id}</td>
                                        <td className="py-3 px-4 font-medium">{invoice.clientName}</td>
                                        <td className="py-3 px-4 text-gray-600">{invoice.date}</td>
                                        <td className="py-3 px-4 font-bold">${invoice.amount}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {getStatusText(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{invoice.type}</td>
                                        <td className="py-3 px-4">
                                            <button className="text-blue-600 hover:text-blue-800 mr-3">
                                                <FiEye className="inline mr-1" /> Görüntüle
                                            </button>
                                            <button className="text-green-600 hover:text-green-800">
                                                <FiDownload className="inline mr-1" /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 text-sm text-gray-500">
                <p>Bu sayfa PT ve diyetisyenlerin hizmet gelirlerini ve faturalarını yönetmeleri için tasarlanmıştır. Gerçek veriler için Supabase entegrasyonu yapılmalıdır.</p>
            </div>
        </div>
    );
};

export default Billing;
