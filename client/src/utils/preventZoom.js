// 모바일 줌 완전 차단
export const preventZoom = () => {
  // 더블탭 줌 방지
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // 핀치 줌 방지
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchmove', (event) => {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });

  // gesturestart 이벤트 차단 (iOS Safari)
  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  }, false);

  document.addEventListener('gesturechange', (event) => {
    event.preventDefault();
  }, false);

  document.addEventListener('gestureend', (event) => {
    event.preventDefault();
  }, false);

  // 휠 이벤트로 인한 줌 방지 (Ctrl + 휠)
  document.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });

  // iOS 10+ 줌 방지
  document.addEventListener('dblclick', (event) => {
    event.preventDefault();
  }, false);
};