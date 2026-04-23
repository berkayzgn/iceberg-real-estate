import { defineStore } from 'pinia';
import type { Agent } from '~/utils/domain';
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'] as const;

function makeInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'NA';
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? name.trim(), lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1] ?? '',
  };
}

function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#64748B';
}

type ApiAgent = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  title: string;
  specialization: string;
  createdAt?: string;
};

function mapApiAgent(agent: ApiAgent): Agent {
  const fullName = agent.fullName?.trim() || `${agent.firstName} ${agent.lastName}`.trim();
  return {
    id: String(agent._id),
    name: fullName,
    initials: makeInitials(fullName),
    avatarColor: colorFromId(String(agent._id)),
    title: agent.title,
    email: agent.email,
    phone: agent.phone,
    joinDate: agent.createdAt
      ? new Date(agent.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '',
    specialization: agent.specialization,
  };
}

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  const apiBase = () => useRuntimeConfig().public.apiBase;

  function findById(id: string) {
    return agents.value.find((a) => a.id === id);
  }

  async function fetchAll(force = false) {
    if (loading.value) return;
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const data = await $fetch<ApiAgent[]>(`${apiBase()}/agents`);
      agents.value = data.map(mapApiAgent);
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function addAgent(input: {
    name: string;
    title: string;
    email: string;
    phone: string;
    specialization: string;
  }) {
    const { firstName, lastName } = splitName(input.name);
    const created = await $fetch<ApiAgent>(`${apiBase()}/agents`, {
      method: 'POST',
      body: {
        firstName,
        lastName: lastName || 'Agent',
        title: input.title.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        specialization: input.specialization.trim(),
      },
    });
    const mapped = mapApiAgent(created);
    agents.value.unshift(mapped);
    loaded.value = true;
    return mapped;
  }

  async function removeAgent(id: string) {
    await $fetch(`${apiBase()}/agents/${id}`, { method: 'DELETE' });
    agents.value = agents.value.filter((a) => a.id !== id);
  }

  function clear() {
    agents.value = [];
    loaded.value = false;
    loading.value = false;
  }

  return {
    agents,
    loading,
    loaded,
    findById,
    fetchAll,
    addAgent,
    removeAgent,
    clear,
  };
});

