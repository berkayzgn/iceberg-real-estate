import { Stage, STAGE_LABELS, STAGE_COLORS } from '../data/mockData';

interface StageBadgeProps {
  stage: Stage;
  size?: 'sm' | 'md';
}

export function StageBadge({ stage, size = 'md' }: StageBadgeProps) {
  const colors = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colors.dot }}
      />
      {label}
    </span>
  );
}
