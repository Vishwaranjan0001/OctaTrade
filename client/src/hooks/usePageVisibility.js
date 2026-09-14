import { useEffect, useState } from "react";

/**
 * Purpose : stop work while the tab is hidden. The WebGL scene and carousel
 *           autoplay both subscribe so a backgrounded tab costs no frames.
 * Input   : none.
 * Output  : boolean — true while the document is visible.
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    () => typeof document === "undefined" || !document.hidden
  );

  useEffect(() => {
    const onChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return isVisible;
}
