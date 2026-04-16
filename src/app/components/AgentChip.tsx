import { Agent } from '../data/mockData';

interface AgentChipProps {
  agent: Agent;
  role?: string;
  size?: 'sm' | 'md';
}

export function AgentChip({ agent, role, size = 'md' }: AgentChipProps) {
  const avatarSize = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${avatarSize} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
        style={{ backgroundColor: agent.avatarColor }}
      >
        {agent.initials}
      </div>
      <div>
        <p className={`${textSize} font-medium text-[#0A1628]`}>{agent.name}</p>
        {role && <p className="text-xs text-[#64748B]">{role}</p>}
      </div>
    </div>
  );
}

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AgentAvatar({ agent, size = 'md' }: AgentAvatarProps) {
  const sizeClass = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: agent.avatarColor }}
      title={agent.name}
    >
      {agent.initials}
    </div>
  );
}
