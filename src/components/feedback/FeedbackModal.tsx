import React, { useState } from 'react';
import { AnalyticsService } from '../../services/telemetry/analyticsService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'workout' | 'camera' | 'voice' | 'nutrition' | 'hydration' | 'progress' | 'friday_answer' | 'ui' | 'bug' | 'other';
  interactionRef?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'other',
  interactionRef,
}) => {
  const [rating, setRating] = useState<'helpful' | 'unhelpful'>('helpful');
  const [category, setCategory] = useState(defaultCategory);
  const [comment, setComment] = useState('');
  const [isBugReport, setIsBugReport] = useState(false);
  const [severity, setSeverity] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [reproSteps, setReproSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isBugReport) {
      await AnalyticsService.reportIssue({
        category,
        severity,
        reproductionSteps: reproSteps || 'Not specified',
        expectedBehavior: 'Feature should complete smoothly',
        actualBehavior: comment || 'Encountered unexpected behavior',
      });
    } else {
      await AnalyticsService.submitFeedback({
        rating,
        category,
        comment: comment || undefined,
        interactionRef,
      });
    }

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-100">
            {isBugReport ? 'Report a Beta Issue' : 'Beta Feedback'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close feedback modal"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-emerald-400 font-semibold text-lg">Thank you for your feedback!</p>
            <p className="text-xs text-slate-400 mt-1">Your input helps shape the final release of FRIDAY.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isBugReport ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">How was your experience?</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRating('helpful')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      rating === 'helpful'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>👍</span> Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => setRating('unhelpful')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      rating === 'unhelpful'
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>👎</span> Not Helpful
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Issue Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="P0">P0 — System crash / data lost / blocked</option>
                  <option value="P1">P1 — Major feature broken</option>
                  <option value="P2">P2 — Inconvenience / minor issue</option>
                  <option value="P3">P3 — Cosmetic / copy suggestion</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="workout">Workout & Sets</option>
                <option value="camera">Camera Tracking</option>
                <option value="voice">Voice Interaction</option>
                <option value="nutrition">Nutrition & Meals</option>
                <option value="hydration">Hydration</option>
                <option value="progress">Progress & Photos</option>
                <option value="friday_answer">FRIDAY AI Response</option>
                <option value="ui">UI & Navigation</option>
                <option value="bug">Bug / Defect</option>
                <option value="other">Other</option>
              </select>
            </div>

            {isBugReport && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reproduction Steps</label>
                <textarea
                  value={reproSteps}
                  onChange={(e) => setReproSteps(e.target.value)}
                  placeholder="1. Go to workout page 2. Click start 3. Saw..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {isBugReport ? 'What happened?' : 'Tell FRIDAY what went well or wrong (optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                maxLength={500}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsBugReport(!isBugReport)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                {isBugReport ? '← Switch to general feedback' : 'Report technical bug instead'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
