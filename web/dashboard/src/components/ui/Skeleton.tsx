import React from 'react';

interface SkeletonProps {
    className?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'lg' }) => {
    const radiusClasses = {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full'
    };

    return (
        <div 
            className={`animate-pulse bg-gray-200 ${radiusClasses[rounded]} ${className}`}
            style={{ animationDuration: '1.5s' }}
        />
    );
};

export default Skeleton;
