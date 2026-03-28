import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit3, FiTrash2, FiUsers, FiClock, FiMapPin, FiCalendar, FiDollarSign, FiStar, FiSearch, FiTrendingUp, FiMessageSquare, FiThumbsUp, FiAlertCircle } from 'react-icons/fi';
import { MdFitnessCenter, MdRestaurant } from 'react-icons/md';
import { db } from '../lib/supabase';

const FALLBACK_COURSES = [
    {
        id: 1,
        title: 'Fat Burning HIIT Program',
        description: 'High-intensity interval training designed for maximum fat loss. Includes personalized meal plans and weekly check-ins.',
        type: 'fitness',
        duration: '8 weeks',
        sessions: 24,
        enrolled: 12,
        maxStudents: 15,
        price: 299,
        rating: 4.8,
        reviews: 28,
        location: 'In-Person',
        city: 'Istanbul',
        schedule: 'Mon, Wed, Fri - 07:00',
        image: null,
        status: 'active',
        level: 'Intermediate',
    },
    {
        id: 2,
        title: 'Strength & Muscle Building',
        description: 'Progressive overload strength training with detailed form coaching and nutrition guidance for muscle gain.',
        type: 'fitness',
        duration: '12 weeks',
        sessions: 36,
        enrolled: 8,
        maxStudents: 10,
        price: 449,
        rating: 4.9,
        reviews: 45,
        location: 'In-Person',
        city: 'Ankara',
        schedule: 'Tue, Thu, Sat - 18:00',
        image: null,
        status: 'active',
        level: 'Advanced',
    },
    {
        id: 3,
        title: 'Healthy Eating Masterclass',
        description: 'Learn to meal prep, understand macros, and build sustainable nutrition habits with hands-on cooking sessions.',
        type: 'nutrition',
        duration: '6 weeks',
        sessions: 12,
        enrolled: 18,
        maxStudents: 20,
        price: 199,
        rating: 4.7,
        reviews: 33,
        location: 'In-Person',
        city: 'Istanbul',
        schedule: 'Sat - 10:00',
        image: null,
        status: 'active',
        level: 'Beginner',
    },
    {
        id: 4,
        title: 'Yoga & Flexibility',
        description: 'Improve flexibility, reduce stress, and build core strength through guided yoga sessions with professional instruction.',
        type: 'fitness',
        duration: '4 weeks',
        sessions: 16,
        enrolled: 20,
        maxStudents: 20,
        price: 149,
        rating: 4.6,
        reviews: 19,
        location: 'In-Person',
        city: 'Izmir',
        schedule: 'Mon-Fri - 06:30',
        image: null,
        status: 'completed',
        level: 'All Levels',
    },
    {
        id: 5,
        title: 'Sports Nutrition Program',
        description: 'Specialized nutrition plan for athletes focusing on performance, recovery, and body composition optimization.',
        type: 'nutrition',
        duration: '10 weeks',
        sessions: 20,
        enrolled: 5,
        maxStudents: 8,
        price: 399,
        rating: 5.0,
        reviews: 8,
        location: 'In-Person',
        city: 'Istanbul',
        schedule: 'Wed, Fri - 14:00',
        image: null,
        status: 'draft',
        level: 'Advanced',
    },
];
type CourseStatus = 'active' | 'completed' | 'draft';
type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

const Courses = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState(FALLBACK_COURSES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<any>(null);
    const [editingCourse, setEditingCourse] = useState<any>(null);

    const [newCourse, setNewCourse] = useState({
        title: '', description: '', type: 'fitness', duration: '', sessions: '',
        maxStudents: '', price: '', location: 'In-Person', city: '', schedule: '', level: 'Beginner',
    });

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchErr } = await db.getCourses(1, 50);
            if (fetchErr) { throw fetchErr; }
            if (data && data.length > 0) {
                setCourses(data);
            }
        } catch (err: any) {
            console.error('Failed to load courses:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleCreateCourse = async (status = 'draft') => {
        if (!newCourse.title.trim()) { return; }
        setSaving(true);
        try {
            const courseData = {
                ...newCourse,
                sessions: parseInt(newCourse.sessions) || 0,
                max_students: parseInt(newCourse.maxStudents) || 10,
                price: parseFloat(newCourse.price) || 0,
                status,
                enrolled: 0,
                rating: 0,
                reviews: 0,
            };
            const { error: createErr } = await db.createCourse(courseData);
            if (createErr) { throw createErr; }
            setShowCreateModal(false);
            setNewCourse({ title: '', description: '', type: 'fitness', duration: '', sessions: '', maxStudents: '', price: '', location: 'In-Person', city: '', schedule: '', level: 'Beginner' });
            fetchCourses();
        } catch (err: any) {
            setError('Failed to create course: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCourse = async (courseId: number | string) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) { return; }
        try {
            const normalizedCourseId = String(courseId);
            const { error: delErr } = await db.deleteCourse(normalizedCourseId);
            if (delErr) { throw delErr; }
            setCourses(prev => prev.filter(c => String(c.id) !== normalizedCourseId));
        } catch (err: any) {
            setError('Failed to delete course: ' + err.message);
        }
    };

    const handleEditCourse = (course: any) => {
        setEditingCourse(course);
        setNewCourse({
            title: course.title || '',
            description: course.description || '',
            type: course.type || 'fitness',
            duration: course.duration || '',
            sessions: String(course.sessions || ''),
            maxStudents: String(course.maxStudents || course.max_students || ''),
            price: String(course.price || ''),
            location: course.location || 'In-Person',
            city: course.city || '',
            schedule: course.schedule || '',
            level: course.level || 'Beginner',
        });
        setShowCreateModal(true);
    };

    const handleUpdateCourse = async () => {
        if (!editingCourse) { return; }
        setSaving(true);
        try {
            const updates = {
                title: newCourse.title,
                description: newCourse.description,
                type: newCourse.type,
                duration: newCourse.duration,
                sessions: parseInt(newCourse.sessions) || 0,
                max_students: parseInt(newCourse.maxStudents) || 10,
                price: parseFloat(newCourse.price) || 0,
                location: newCourse.location,
                city: newCourse.city,
                schedule: newCourse.schedule,
                level: newCourse.level,
            };
            const { error: upErr } = await db.updateCourse(editingCourse.id, updates);
            if (upErr) { throw upErr; }
            setShowCreateModal(false);
            setEditingCourse(null);
            setNewCourse({ title: '', description: '', type: 'fitness', duration: '', sessions: '', maxStudents: '', price: '', location: 'In-Person', city: '', schedule: '', level: 'Beginner' });
            fetchCourses();
        } catch (err: any) {
            setError('Failed to update course: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        if (activeTab !== 'all' && course.type !== activeTab && activeTab !== course.status) { return false; }
        if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) { return false; }
        return true;
    });

    const stats = [
        { label: 'Total Courses', value: courses.length, icon: MdFitnessCenter, color: 'bg-blue-500', change: '+2 this month' },
        { label: 'Active Students', value: courses.reduce((sum, c) => sum + c.enrolled, 0), icon: FiUsers, color: 'bg-emerald-500', change: '+15 this week' },
        { label: 'Total Revenue', value: `$${courses.reduce((sum, c) => sum + (c.price * c.enrolled), 0).toLocaleString()}`, icon: FiDollarSign, color: 'bg-violet-500', change: '+23% growth' },
        { label: 'Average Rating', value: (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1), icon: FiStar, color: 'bg-amber-500', change: 'Excellent' },
    ];

    const getStatusBadge = (status: CourseStatus) => {
        const map = {
            active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
            completed: 'bg-gray-100 text-gray-600 ring-1 ring-gray-400/20',
            draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        };
        return map[status] || map.draft;
    };

    const getLevelColor = (level: CourseLevel) => {
        const map = {
            'Beginner': 'bg-green-50 text-green-700',
            'Intermediate': 'bg-blue-50 text-blue-700',
            'Advanced': 'bg-purple-50 text-purple-700',
            'All Levels': 'bg-gray-50 text-gray-700',
        };
        return map[level] || map['All Levels'];
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Courses</h1>
                    <p className="text-gray-500 mt-1">Manage your in-person training programs and education courses</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                    <FiPlus className="w-4 h-4" />
                    Create Course
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg">&times;</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className={`${stat.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
                                <FiTrendingUp className="w-3 h-3" />
                                {stat.change}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'fitness', label: 'Fitness' },
                        { id: 'nutrition', label: 'Nutrition' },
                        { id: 'active', label: 'Active' },
                        { id: 'draft', label: 'Drafts' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                        {/* Course Header Image/Gradient */}
                        <div className={`relative h-40 ${course.type === 'fitness'
                            ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500'
                            : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'}`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)' }}></div>
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(course.status as CourseStatus)}`}>
                                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                                </span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getLevelColor(course.level as CourseLevel)}`}>
                                    {course.level}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                                    <FiEdit3 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/80 transition-colors">
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-4 text-white">
                                {course.type === 'fitness'
                                    ? <MdFitnessCenter className="w-10 h-10 opacity-60" />
                                    : <MdRestaurant className="w-10 h-10 opacity-60" />}
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white">
                                <span className="text-lg font-bold">${course.price}</span>
                            </div>
                        </div>

                        {/* Course Info */}
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiClock className="w-4 h-4 text-gray-400" />
                                    {course.duration}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiCalendar className="w-4 h-4 text-gray-400" />
                                    {course.sessions} sessions
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiMapPin className="w-4 h-4 text-gray-400" />
                                    {course.city}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiUsers className="w-4 h-4 text-gray-400" />
                                    {course.enrolled}/{course.maxStudents}
                                </div>
                            </div>

                            {/* Enrollment Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs text-gray-500 font-medium">Enrollment</span>
                                    <span className="text-xs font-bold text-gray-700">{Math.round((course.enrolled / course.maxStudents) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${course.enrolled >= course.maxStudents ? 'bg-red-500' :
                                            course.enrolled >= course.maxStudents * 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${(course.enrolled / course.maxStudents) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                    <FiStar className="w-4 h-4 text-amber-400 fill-current" />
                                    <span className="text-sm font-bold text-gray-900">{course.rating}</span>
                                    <span className="text-xs text-gray-400">({course.reviews})</span>
                                </div>
                                <div className="text-xs text-gray-500">{course.schedule}</div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Create New Course Card */}
                <div
                    onClick={() => setShowCreateModal(true)}
                    className="group bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center p-10 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[420px]"
                >
                    <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:scale-110">
                        <FiPlus className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Create New Course</p>
                    <p className="text-sm text-gray-400 mt-2 text-center">Add a new in-person training program</p>
                </div>
            </div>

            {/* Student Reviews & Ratings Section */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 rounded-xl">
                                <FiStar className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Student Reviews & Ratings</h2>
                                <p className="text-sm text-gray-500">Feedback from your course participants</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="flex items-center gap-1">
                                    <FiStar className="w-5 h-5 text-amber-400 fill-current" />
                                    <span className="text-2xl font-bold text-gray-900">
                                        {(courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">{courses.reduce((sum, c) => sum + c.reviews, 0)} total reviews</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</h3>
                            <div className="space-y-2">
                                {[
                                    { stars: 5, count: 62, pct: 54 },
                                    { stars: 4, count: 32, pct: 28 },
                                    { stars: 3, count: 14, pct: 12 },
                                    { stars: 2, count: 4, pct: 3 },
                                    { stars: 1, count: 3, pct: 3 },
                                ].map(r => (
                                    <div key={r.stars} className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 w-3 font-medium">{r.stars}</span>
                                        <FiStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${r.pct}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500 w-12 text-right">{r.count} ({r.pct}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Per Course Rating</h3>
                            <div className="space-y-3">
                                {courses.filter(c => c.status === 'active').map(course => (
                                    <div key={course.id} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${course.type === 'fitness' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-sm text-gray-700 flex-1 truncate">{course.title}</span>
                                        <div className="flex items-center gap-1">
                                            <FiStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                            <span className="text-sm font-bold text-gray-900">{course.rating}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">({course.reviews})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Ahmet Y.', course: 'Fat Burning HIIT Program', rating: 5, text: 'Incredible program! Lost 8kg in 8 weeks. The trainer\'s attention to form and personalized approach made all the difference.', date: '2 weeks ago', helpful: 12 },
                            { name: 'Elif K.', course: 'Strength & Muscle Building', rating: 5, text: 'Best investment I\'ve made in my fitness journey. The progressive overload approach and nutrition guidance are top-notch.', date: '3 weeks ago', helpful: 8 },
                            { name: 'Mert B.', course: 'Healthy Eating Masterclass', rating: 4, text: 'Very informative sessions. Learned a lot about meal prep and macros. Would have liked more hands-on cooking.', date: '1 month ago', helpful: 5 },
                            { name: 'Zeynep A.', course: 'Fat Burning HIIT Program', rating: 5, text: 'Life-changing experience! The WhatsApp support between sessions kept me accountable. Highly recommend!', date: '1 month ago', helpful: 15 },
                            { name: 'Can D.', course: 'Sports Nutrition Program', rating: 5, text: 'As a competitive swimmer, this program optimized my nutrition for peak performance. Blood test analysis was a game-changer.', date: '2 months ago', helpful: 7 },
                        ].map((review, i) => (
                            <div key={i} className="group flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                    {review.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-gray-900">{review.name}</span>
                                        <span className="text-xs text-gray-400">on</span>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{review.course}</span>
                                        <span className="text-xs text-gray-400 ml-auto">{review.date}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {Array.from({ length: 5 }, (_, j) => (
                                            <FiStar key={j} className={`w-3.5 h-3.5 ${j < review.rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{review.text}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                                            <FiThumbsUp className="w-3.5 h-3.5" />
                                            Helpful ({review.helpful})
                                        </button>
                                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                                            <FiMessageSquare className="w-3.5 h-3.5" />
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                                    <p className="text-sm text-gray-500 mt-1">Set up a new in-person training program</p>
                                </div>
                                <button onClick={() => { setShowCreateModal(false); setEditingCourse(null); setNewCourse({ title: '', description: '', type: 'fitness', duration: '', sessions: '', maxStudents: '', price: '', location: 'In-Person', city: '', schedule: '', level: 'Beginner' }); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-xl text-gray-400">×</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title</label>
                                <input
                                    type="text"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g. Advanced Strength Training"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Describe what students will learn..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                    <select
                                        value={newCourse.type}
                                        onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="fitness">Fitness</option>
                                        <option value="nutrition">Nutrition</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                                    <select
                                        value={newCourse.level}
                                        onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={newCourse.duration}
                                        onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g. 8 weeks"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Sessions</label>
                                    <input
                                        type="number"
                                        value={newCourse.sessions}
                                        onChange={(e) => setNewCourse({ ...newCourse, sessions: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Students</label>
                                    <input
                                        type="number"
                                        value={newCourse.maxStudents}
                                        onChange={(e) => setNewCourse({ ...newCourse, maxStudents: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        value={newCourse.price}
                                        onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="299"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={newCourse.city}
                                        onChange={(e) => setNewCourse({ ...newCourse, city: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Istanbul"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
                                <input
                                    type="text"
                                    value={newCourse.schedule}
                                    onChange={(e) => setNewCourse({ ...newCourse, schedule: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g. Mon, Wed, Fri - 18:00"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            {editingCourse ? (
                                <button
                                    onClick={handleUpdateCourse}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Update Course'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleCreateCourse('draft')}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save as Draft'}
                                    </button>
                                    <button
                                        onClick={() => handleCreateCourse('active')}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                                    >
                                        {saving ? 'Publishing...' : 'Publish Course'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
