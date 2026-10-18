// Pause the identity's motion whenever its surface is hidden or outside the viewport.
(() => {
  const logos = [...document.querySelectorAll('.logo')];
  const visible = new Set();
  const update = () => logos.forEach((logo) => {
    logo.dataset.brandActive = String(!document.hidden && visible.has(logo));
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visible.add(target);
        else visible.delete(target);
      });
      update();
    });
    logos.forEach((logo) => observer.observe(logo));
  } else {
    logos.forEach((logo) => visible.add(logo));
    update();
  }
  document.addEventListener('visibilitychange', update);
})();
