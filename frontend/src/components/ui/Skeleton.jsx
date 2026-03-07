const SkeletonCard = () => (
    <div className="premium-card p-6 animate-fade-in">
        <div className="skeleton h-48 rounded-xl mb-4"></div>
        <div className="skeleton h-6 w-3/4 rounded mb-3"></div>
        <div className="skeleton h-4 w-full rounded mb-2"></div>
        <div className="skeleton h-4 w-2/3 rounded"></div>
    </div>
);

const SkeletonList = () => (
    <div className="space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="premium-card p-6 flex items-center gap-4 animate-fade-in">
                <div className="skeleton w-16 h-16 rounded-full flex-shrink-0"></div>
                <div className="flex-grow space-y-3">
                    <div className="skeleton h-5 w-1/2 rounded"></div>
                    <div className="skeleton h-4 w-3/4 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

const SkeletonProfile = () => (
    <div className="premium-card p-8 text-center animate-fade-in">
        <div className="skeleton w-32 h-32 rounded-3xl mx-auto mb-6"></div>
        <div className="skeleton h-8 w-48 rounded mx-auto mb-4"></div>
        <div className="skeleton h-4 w-32 rounded mx-auto mb-6"></div>
        <div className="skeleton h-12 w-full rounded-xl mb-3"></div>
        <div className="skeleton h-12 w-full rounded-xl"></div>
    </div>
);

export { SkeletonCard, SkeletonList, SkeletonProfile };
