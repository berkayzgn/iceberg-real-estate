import type { Ref } from 'vue';

/**
 * React `MetricCard` ile aynı: ease-out cubic, tek seferlik sayaç.
 */
export function useCountUp(target: Ref<number>, duration = 1200) {
  const value = ref(0);

  onMounted(() => {
    const tgt = target.value;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - progress) ** 3;
      value.value = Math.round(tgt * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  return value;
}
