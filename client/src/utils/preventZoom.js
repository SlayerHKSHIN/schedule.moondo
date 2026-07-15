// Keep this compatibility hook free of document-level gesture listeners.
// Non-passive touch/wheel listeners can delay or cancel native page scrolling.
export const preventZoom = () => {
  return undefined;
};
