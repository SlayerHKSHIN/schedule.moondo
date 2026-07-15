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
