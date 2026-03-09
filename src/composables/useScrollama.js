import scrollama from 'scrollama';
import { onMounted, onUnmounted } from 'vue';

export function useScrollama({
  stepSelector = '.step',
  offset = 0.6,
  progress = false,
  onStepEnter,
  onStepProgress
}) {
  const scroller = scrollama();

  const handleResize = () => {
    scroller.resize();
  };

  onMounted(() => {
    scroller
      .setup({
        step: stepSelector,
        offset,
        progress
      })
      .onStepEnter(({ index, element, direction }) => {
        if (onStepEnter) {
          onStepEnter({ index, element, direction });
        }
      })
      .onStepProgress(({ index, progress: stepProgress, element, direction }) => {
        if (onStepProgress) {
          onStepProgress({ index, progress: stepProgress, element, direction });
        }
      });

    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    scroller.destroy();
  });
}
