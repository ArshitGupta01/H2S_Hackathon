
import React, { memo } from 'react';

const SkeletonCard: React.FC<{ gridSpan?: string }> = memo(({ gridSpan }) => (
    <div className={`glass-card p-6 ${gridSpan}`}>
        <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-slate-700/50 rounded-full"></div>
            <div className="w-32 h-6 bg-slate-700/50 rounded"></div>
        </div>
        <div className="space-y-3">
            <div className="w-full h-4 bg-slate-700/50 rounded"></div>
            <div className="w-5/6 h-4 bg-slate-700/50 rounded"></div>
            <div className="w-3/4 h-4 bg-slate-700/50 rounded"></div>
             <div className="w-full h-4 bg-slate-700/50 rounded mt-4"></div>
            <div className="w-1/2 h-4 bg-slate-700/50 rounded"></div>
        </div>
    </div>
));

export const ReportSkeleton: React.FC = memo(() => {
    return (
        <div className="mt-8 animate-fade-in">
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard gridSpan="lg:col-span-2" />
                <SkeletonCard gridSpan="lg:col-span-1" />
                <SkeletonCard gridSpan="lg:col-span-1" />
                <SkeletonCard gridSpan="lg:col-span-2" />
            </div>
        </div>
    );
});
