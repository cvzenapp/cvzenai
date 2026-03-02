import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

interface AITrainingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AITrainingInfoModal({ isOpen, onClose }: AITrainingInfoModalProps) {
  const trainingModels = [
    {
      title: "Resume Parsing",
      description: "Trained to extract structured candidate data across 20+ fields, skills, experience, education, projects, dates, with 90%+ accuracy on real-world resumes including non-standard layouts and complex formatting."
    },
    {
      title: "Job Description Generation",
      description: "Built on 1.6M lines of JD data, refined to 1.2M quality records across 25 roles and 18 experience levels. Generates precise, unbiased JDs, not generic templates."
    },
    {
      title: "ATS Scoring",
      description: "Trained on 12,093 labeled examples to score candidate-to-JD fit. Purpose-built for hiring signal, not keyword matching."
    },
    {
      title: "Bias-Free Screening",
      description: "Trained on 54,000+ labeled ground truth examples to evaluate candidates on merit, not demographic proxies."
    },
    {
      title: "Fake Job Detection",
      description: "AI-trained to identify fraudulent job postings before they reach candidates."
    },
    {
      title: "Privacy & PII Protection",
      description: "Parsing is processed via Groq's API with Zero Data Retention enabled. No candidate data is stored, shared, or used to train AI models. cvZen does not share candidate data beyond what is required for platform functionality."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-normal text-slate-900">How cvZen's AI Was Built</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <p className="text-slate-600 mb-6">
                Most AI hiring tools run on general-purpose LLMs. cvZen doesn't. Every model powering this platform was trained on purpose-specific datasets built for one job and one job only.
              </p>

              <div className="space-y-4">
                {trainingModels.map((model, index) => (
                  <div key={index} className="border-l-2 border-blue-600 pl-4">
                    <h3 className="font-normal text-slate-900 mb-1">
                      {model.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Why This Matters Section */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm font-normal text-slate-900 mb-2">
                  Why does this matter?
                </p>
                <p className="text-sm text-slate-600">
                  General LLMs optimize for language fluency. cvZen's models optimize for hiring accuracy. That's a different objective, and it shows in the results.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
