import React from 'react';
import { Star } from 'lucide-react';

const ReviewCard = ({ review }) => {
    const { author_detail, rating, comment, created_at } = review;

    const renderStars = (count) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                className={i < count ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
            />
        ));
    };

    return (
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold">
                        {author_detail?.first_name?.[0] || author_detail?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">
                            {author_detail?.first_name ? `${author_detail.first_name} ${author_detail.last_name || ''}` : author_detail?.email || 'Unknown User'}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            {renderStars(rating)}
                        </div>
                    </div>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(created_at).toLocaleDateString()}
                </span>
            </div>
            <p className="text-gray-600 italic leading-relaxed">
                "{comment}"
            </p>
        </div>
    );
};

export default ReviewCard;
