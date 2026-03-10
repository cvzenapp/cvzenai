import React, { useState, useEffect } from 'react';
import { Check, Plus, X, Brain } from 'lucide-react';

export interface EvaluationMetric {
  id: number;
  metric: string;
  score: string | null;
  checked: boolean;
}

interface EvaluationMetricsEditorProps {
  value: EvaluationMetric[];
  onChange: (metrics: EvaluationMetric[]) => void;
  candidateName?: string;
  jobTitle?: string;
  isAIGenerated?: boolean;
}

// Default evaluation metrics based on the image
const DEFAULT_METRICS = [
  "Technical expertise in frontend development (JavaScript frameworks, HTML/CSS, responsive design principles)",
  "Experience with frontend build tools, UI component libraries, and accessibility standards", 
  "Ability to work with cross-functional teams and meet business objectives",
  "Problem-solving skills and attention to detail"
];

export const EvaluationMetricsEditor: React.FC<EvaluationMetricsEditorProps> = ({
  value,
  onChange,
  candidateName,
  jobTitle,
  isAIGenerated = false
}) => {
  const [metrics, setMetrics] = useState<EvaluationMetric[]>(value);
  const [newMetric, setNewMetric] = useState('');
  const [isAddingMetric, setIsAddingMetric] = useState(false);

  // Initialize with default metrics if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultMetrics: EvaluationMetric[] = DEFAULT_METRICS.map((metric, index) => ({
        id: index + 1,
        metric: metric.replace(/Alex Jackson/g, candidateName || 'the candidate'),
        score: null,
        checked: true
      }));
      setMetrics(defaultMetrics);
      onChange(defaultMetrics);
    } else {
      setMetrics(value);
    }
  }, [value, candidateName, onChange]);

  const handleMetricToggle = (id: number) => {
    const updatedMetrics = metrics.map(metric =>
      metric.id === id ? { ...metric, checked: !metric.checked } : metric
    );
    setMetrics(updatedMetrics);
    onChange(updatedMetrics);
  };

  const handleScoreChange = (id: number, score: string) => {
    const updatedMetrics = metrics.map(metric =>
      metric.id === id ? { ...metric, score: score || null } : metric
    );
    setMetrics(updatedMetrics);
    onChange(updatedMetrics);
  };

  const handleAddMetric = () => {
    if (newMetric.trim()) {
      const newId = Math.max(...metrics.map(m => m.id), 0) + 1;
      const newMetricObj: EvaluationMetric = {
        id: newId,
        metric: newMetric.trim(),
        score: null,
        checked: true
      };
      const updatedMetrics = [...metrics, newMetricObj];
      setMetrics(updatedMetrics);
      onChange(updatedMetrics);
      setNewMetric('');
      setIsAddingMetric(false);
    }
  };

  const handleRemoveMetric = (id: number) => {
    const updatedMetrics = metrics.filter(metric => metric.id !== id);
    setMetrics(updatedMetrics);
    onChange(updatedMetrics);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 font-jakarta">
          Evaluation Metrics (not visible to candidate)
        </label>
        {isAIGenerated && (
          <div className="flex items-center space-x-1 text-xs text-purple-600 font-jakarta">
            <Brain className="w-3 h-3" />
            <span>AI Generated</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="checkbox"
                id={`metric-${metric.id}`}
                checked={metric.checked}
                onChange={() => handleMetricToggle(metric.id)}
                className="w-4 h-4 text-brand-main bg-gray-100 border-gray-300 rounded focus:ring-brand-main focus:ring-2"
              />
              <label 
                htmlFor={`metric-${metric.id}`}
                className="flex-1 text-sm text-slate-700 font-jakarta cursor-pointer"
              >
                {metric.metric}
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={metric.score || ''}
                onChange={(e) => handleScoreChange(metric.id, e.target.value)}
                placeholder="Score"
                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-brand-main focus:border-brand-main font-jakarta"
              />
              <button
                type="button"
                onClick={() => handleRemoveMetric(metric.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Remove metric"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {isAddingMetric ? (
          <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-lg">
            <input
              type="text"
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMetric()}
              placeholder="Enter new evaluation metric..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-brand-main focus:border-brand-main font-jakarta"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddMetric}
              disabled={!newMetric.trim()}
              className="px-3 py-2 bg-brand-main text-white rounded hover:bg-brand-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingMetric(false);
                setNewMetric('');
              }}
              className="px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingMetric(true)}
            className="flex items-center space-x-2 p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-main hover:bg-brand-main/5 transition-colors text-slate-600 hover:text-brand-main font-jakarta"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add custom evaluation metric</span>
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 font-jakarta">
        Check the metrics you want to evaluate during the interview. You can add scores during or after the interview.
      </p>
    </div>
  );
};