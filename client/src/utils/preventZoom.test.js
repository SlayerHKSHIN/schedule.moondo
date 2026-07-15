import { preventZoom } from './preventZoom';

test('allows a single-touch move so the page can scroll', () => {
  preventZoom();

  const touchMove = new Event('touchmove', {
    bubbles: true,
    cancelable: true
  });
  Object.defineProperty(touchMove, 'touches', {
    value: [{}]
  });

  document.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(false);
});

test('does not cancel rapid touch endings that can finish a scroll gesture', () => {
  preventZoom();

  const firstTouchEnd = new Event('touchend', { bubbles: true, cancelable: true });
  const secondTouchEnd = new Event('touchend', { bubbles: true, cancelable: true });

  document.dispatchEvent(firstTouchEnd);
  document.dispatchEvent(secondTouchEnd);

  expect(secondTouchEnd.defaultPrevented).toBe(false);
});
