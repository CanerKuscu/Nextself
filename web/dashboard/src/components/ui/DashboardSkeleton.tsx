import React from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 animate-fade-in w-full">
            {/* Banner Skeleton */}
            <Skeleton className="w-full h-[180px]" rounded="2xl" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <Skeleton className="w-12 h-12" rounded="xl" />
                            <Skeleton className="w-16 h-5" rounded="md" />
                        </div>
                        <Skeleton className="w-24 h-8 mb-2" rounded="md" />
                        <Skeleton className="w-32 h-4 mb-2" rounded="md" />
                        <Skeleton className="w-20 h-3" rounded="sm" />
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                        <Skeleton className="w-11 h-11" rounded="xl" />
                        <Skeleton className="w-24 h-4" rounded="md" />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <Skeleton className="w-40 h-6 mb-2" rounded="md" />
                            <Skeleton className="w-32 h-4" rounded="sm" />
                        </div>
                        <Skeleton className="w-32 h-8" rounded="lg" />
                    </div>
                    <Skeleton className="w-full h-80" rounded="lg" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <Skeleton className="w-48 h-6 mb-2" rounded="md" />
                    <Skeleton className="w-40 h-4 mb-6" rounded="sm" />
                    <Skeleton className="w-48 h-48 mx-auto rounded-full" />
                    <div className="mt-6 space-y-3">
                        <Skeleton className="w-full h-5" rounded="md" />
                        <Skeleton className="w-full h-5" rounded="md" />
                        <Skeleton className="w-full h-5" rounded="md" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
