import { Stage, STAGE_ORDER, STAGE_LABELS } from '../data/mockData';
import { Check } from 'lucide-react';

interface ProgressStepperProps {
  currentStage: Stage;
}

export function ProgressStepper({ currentStage }: ProgressStepperProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center w-full">
      {STAGE_ORDER.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isUpcoming = idx > currentIdx;

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  backgroundColor: isCompleted ? '#10B981' : isCurrent ? '#D4A853' : '#E2E8F0',
                  color: isCompleted || isCurrent ? '#fff' : '#94A3B8',
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className="text-xs mt-2 font-medium text-center whitespace-nowrap"
                style={{
                  color: isCompleted ? '#059669' : isCurrent ? '#D4A853' : '#94A3B8',
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: idx < currentIdx ? '#10B981' : '#E2E8F0',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
