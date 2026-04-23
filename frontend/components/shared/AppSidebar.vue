<script setup lang="ts">
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-vue-next';

const route = useRoute();
const ui = useUiStore();
const { t } = useI18n();

const navItems = [
  { to: '/', labelKey: 'common.panel', icon: LayoutDashboard, exact: true },
  { to: '/transactions', labelKey: 'common.transactions', icon: FileText },
  { to: '/agents', labelKey: 'common.agents', icon: Users },
  { to: '/reports', labelKey: 'common.reports', icon: BarChart3 },
] as const;

function isActive(path: string, exact?: boolean) {
  if (exact) return route.path === path;
  return route.path === path || route.path.startsWith(`${path}/`);
}

</script>

<template>
  <aside
    class="hidden lg:flex flex-col flex-shrink-0 border-r border-white/10 transition-[width] duration-300 ease-in-out"
    :style="{
      width: ui.sidebarCollapsed ? '72px' : '240px',
      backgroundColor: '#0A1628',
    }"
  >
    <div class="flex items-center gap-3 border-b border-white/10 px-4 py-5">
      <div
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style="background-color: #d4a853"
      >
        <Building2 class="h-5 w-5 text-white" />
      </div>
      <div v-if="!ui.sidebarCollapsed" class="overflow-hidden">
        <div
          class="text-base font-bold tracking-tight text-white"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ t('brand.name') }}
        </div>
        <div class="text-xs text-white/40">{{ t('brand.productSubtitle') }}</div>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-2 py-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          isActive(item.to, item.exact)
            ? 'bg-white/10 text-white'
            : 'text-white/50 hover:bg-white/5 hover:text-white',
        ]"
        :title="ui.sidebarCollapsed ? t(item.labelKey) : undefined"
      >
        <component
          :is="item.icon"
          class="h-5 w-5 flex-shrink-0"
          :class="isActive(item.to, item.exact) ? 'text-[#D4A853]' : ''"
        />
        <span v-if="!ui.sidebarCollapsed">{{ t(item.labelKey) }}</span>
        <span
          v-if="!ui.sidebarCollapsed && isActive(item.to, item.exact)"
          class="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A853]"
        />
      </NuxtLink>
    </nav>

    <div class="space-y-1 border-t border-white/10 p-2">
      <div class="px-2 pb-1" :class="ui.sidebarCollapsed ? 'flex justify-center' : ''">
        <SharedLanguageSwitcher :collapsed="ui.sidebarCollapsed" />
      </div>
      <NuxtLink
        to="/transactions/create"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/5"
        :title="ui.sidebarCollapsed ? t('common.newTransaction') : undefined"
      >
        <Plus class="h-5 w-5 flex-shrink-0 text-[#D4A853]" />
        <span v-if="!ui.sidebarCollapsed">{{ t('common.newTransaction') }}</span>
      </NuxtLink>
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30 transition-all hover:bg-white/5 hover:text-white/60"
        :aria-label="ui.sidebarCollapsed ? t('common.expand') : t('common.collapse')"
        @click="ui.toggleSidebar()"
      >
        <ChevronRight v-if="ui.sidebarCollapsed" class="h-5 w-5 flex-shrink-0" />
        <template v-else>
          <ChevronLeft class="h-5 w-5 flex-shrink-0" />
          <span>{{ t('common.collapse') }}</span>
        </template>
      </button>
    </div>
  </aside>

  <aside
    class="hidden w-[72px] flex-shrink-0 flex-col border-r border-white/10 md:flex lg:hidden"
    style="background-color: #0a1628"
  >
    <div class="flex items-center justify-center border-b border-white/10 py-5">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl"
        style="background-color: #d4a853"
      >
        <Building2 class="h-5 w-5 text-white" />
      </div>
    </div>
    <nav class="flex flex-1 flex-col space-y-1 px-2 py-4">
      <NuxtLink
        v-for="item in navItems"
        :key="`m-${item.to}`"
        :to="item.to"
        :class="[
          'flex w-full items-center justify-center rounded-xl p-2.5 transition-all',
          isActive(item.to, item.exact)
            ? 'bg-white/10 text-[#D4A853]'
            : 'text-white/50 hover:bg-white/5 hover:text-white',
        ]"
        :title="t(item.labelKey)"
      >
        <component :is="item.icon" class="h-5 w-5" />
      </NuxtLink>
    </nav>
    <div class="flex flex-col items-center gap-1 border-t border-white/10 p-2">
      <NuxtLink
        to="/transactions/create"
        class="flex w-full items-center justify-center rounded-xl p-2.5 text-[#D4A853] transition-all hover:bg-white/5"
        :title="t('common.newTransaction')"
      >
        <Plus class="h-5 w-5" />
      </NuxtLink>
    </div>
  </aside>

  <nav
    class="safe-area-pb fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#E2E8F0] bg-white md:hidden"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="`tab-${item.to}`"
      :to="item.to"
      :class="[
        'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
        isActive(item.to, item.exact) ? 'text-[#D4A853]' : 'text-[#94A3B8]',
      ]"
    >
      <component :is="item.icon" class="h-5 w-5" />
      {{ t(item.labelKey) }}
    </NuxtLink>
    <NuxtLink
      to="/transactions/create"
      class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-[#94A3B8] transition-colors"
    >
      <Plus class="h-5 w-5" />
      {{ t('common.newTransaction') }}
    </NuxtLink>
  </nav>
</template>
