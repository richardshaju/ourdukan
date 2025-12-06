'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface FeedbackFormProps {
  orderId: string;
  shopName: string;
  onSubmitted?: () => void;
}

export default function FeedbackForm({
  orderId,
  shopName,
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<{
    rating: number;
    comment: string;
  } | null>(null);

  useEffect(() => {
    checkExistingFeedback();
  }, [orderId]);

  const checkExistingFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback/check?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.feedback) {
          setExistingFeedback(data.feedback);
          setRating(data.feedback.rating);
          setComment(data.feedback.comment);
        }
      }
    } catch (error) {
      console.error('Error checking existing feedback:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Prevent submission if feedback already exists
    if (existingFeedback) {
      setError('Feedback has already been submitted for this order');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit feedback');
        return;
      }

      setSuccess(true);
      // Clear form state
      setRating(0);
      setComment('');
      // Refresh to show read-only feedback
      await checkExistingFeedback();
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If feedback already exists, show it as read-only
  if (existingFeedback) {
    return (
      <Card className="mt-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          Your Feedback
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          You have already submitted feedback for this order.
        </p>

        <div className="space-y-4">
          {/* Star Rating (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-8 h-8 ${
                    star <= existingFeedback.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {existingFeedback.rating === 1 && 'Poor'}
              {existingFeedback.rating === 2 && 'Fair'}
              {existingFeedback.rating === 3 && 'Good'}
              {existingFeedback.rating === 4 && 'Very Good'}
              {existingFeedback.rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment (Read-only) */}
          {existingFeedback.comment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                {existingFeedback.comment}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <h4 className="font-semibold text-gray-900 mb-3">
        Rate Your Experience
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        How was your experience with {shopName}?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Comment (Optional)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
            placeholder="Share your experience..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Thank you for your feedback!
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
        >
          Submit Feedback
        </Button>
      </form>
    </Card>
  );
}
