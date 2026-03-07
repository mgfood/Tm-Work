import React, { useState } from 'react';
import { Star, Send, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 1. Импорт
import reviewsService from '../../api/reviewsService';

const ReviewForm = ({ job, onReviewSubmitted }) => {
    const { t } = useTranslation(); // 2. Подключаем t
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError(t('reviews.error_rating')); // Перевод ошибки
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await reviewsService.createReview({
                job: job.id,
                rating,
                comment
            });
            onReviewSubmitted();
        } catch (err) {
            // Если сервер вернет ошибку на русском, она отобразится как есть, 
            // иначе сработает наш запасной перевод.
            setError(err.response?.data?.non_field_errors?.[0] || err.message || t('reviews.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-primary-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t('reviews.form_title')}</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('reviews.rating_label')}</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="transition-transform hover:scale-125 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`transition-colors ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-200"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('reviews.comment_label')}</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none h-32 resize-none"
                        placeholder={t('reviews.placeholder')}
                        required
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-lg shadow-primary-100 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            <Send size={18} />
                            {t('reviews.submit_btn')}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;