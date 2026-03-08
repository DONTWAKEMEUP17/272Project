import scrollama from 'scrollama';
import { onMounted, onUnmounted } from 'vue';

export function useScrollama({ stepSelector = '.step', offset = 0.6, onStepEnter }) {
  const scroller = scrollama();

  onMounted(() => {
    scroller
      .setup({
        step: stepSelector,
        offset
      })
      .onStepEnter(({ index, element, direction }) => {
        if (onStepEnter) {
          onStepEnter({ index, element, direction });
        }
      });
  });

  onUnmounted(() => {
    scroller.destroy();
  });
}
