import { useEffect, useState } from "react";

// Purpose: decide whether large scenes may animate. Input: pause choice.
// Output: boolean. File: hooks/use-scene-motion.js.
export function useSceneMotion(paused = false) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const update = () => setAllowed(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return allowed && !paused;
}
