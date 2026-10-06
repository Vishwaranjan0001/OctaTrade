import { useCallback, useEffect, useRef } from 'react';

import './ScrollExpand.css';

// Source: React Bits ScrollExpand (JS + CSS variant).
// Local changes:
// - A video source only plays while the component is on screen (IntersectionObserver).
// - With useWindowScroll, height-only resizes under 160px (a phone's browser bar showing
//   or hiding while scrolling) no longer re-measure the track, which made the page jump.
// - revealMode="curtains" opens the frame by sliding four solid panels away with transforms
//   instead of animating clip-path, so a playing video is never re-clipped (no per-frame mask
//   or raster work). Corners stay square in this mode; curtainColor should match the stage.
// - The media transform is only written when mediaZoom differs from 1.
// - titleMode="grow" sizes the title to fit inside the resting frame and scales it with the
//   frame as it opens (rendered at full size and scaled down, so it stays crisp), fading out
//   just before the overlay content arrives.
// - restDim darkens the media while the title is shown (fading out as the title leaves), so
//   the title reads over bright footage; the overlay scrim takes over near full bleed.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

const ScrollExpand = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  restDim = 0,
  useWindowScroll = false,
  revealMode = 'clip',
  titleMode = 'lift',
  curtainColor = '#000',
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);
  const curtainRefs = useRef([]);
  const titleTextRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    restDim,
    useWindowScroll,
    revealMode,
    titleMode,
    enabled
  };

  const applyProgress = useCallback(p => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    if (c.revealMode === 'curtains') {
      // Each panel is half the stage; translate so it covers exactly the inset on its side.
      const [top, bottom, left, right] = curtainRefs.current;
      const ty = (iy / 50 - 1) * 100;
      const tx = (ix / 50 - 1) * 100;
      if (top) top.style.transform = `translate3d(0, ${ty}%, 0)`;
      if (bottom) bottom.style.transform = `translate3d(0, ${-ty}%, 0)`;
      if (left) left.style.transform = `translate3d(${tx}%, 0, 0)`;
      if (right) right.style.transform = `translate3d(${-tx}%, 0, 0)`;
    } else {
      const r = c.startRadius + (c.endRadius - c.startRadius) * e;
      frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    }

    if (c.mediaZoom !== 1) media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) {
      const late = c.overlayScrim * (c.restDim > 0 ? smoothstep(0.65, 1, p) : e);
      const early = c.restDim * (1 - smoothstep(0.4, 0.8, p));
      scrimRef.current.style.opacity = `${Math.max(early, late)}`;
    }

    if (titleRef.current && c.titleMode === 'grow') {
      // Title scale follows the frame width; it is laid out at the full-width size.
      const out = smoothstep(0.5, 0.8, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `scale(${w / 100})`;
    } else if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = c.titleMode === 'grow' ? smoothstep(0.8, 1, p) : smoothstep(0.68, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let lastW = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      lastW = root.clientWidth;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      const text = titleTextRef.current;
      if (c.titleMode === 'grow' && text) {
        // Fit the title inside the resting frame, then lay it out at the fully-open size.
        text.style.fontSize = '100px';
        const widthAt100 = text.offsetWidth; // layout width, unaffected by the scale transform
        text.style.fontSize = '';
        const restW = (w * c.startWidth) / 100;
        const restH = (stageH * c.startHeight) / 100;
        const restSize = Math.min((restW * 0.84 * 100) / Math.max(widthAt100, 1), restH * 0.3);
        stage.style.setProperty('--se-title-size', `${(restSize * 100) / Math.max(c.startWidth, 1)}px`);
      } else {
        stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
      }
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      if (
        propsRef.current.useWindowScroll &&
        stageH > 0 &&
        root.clientWidth === lastW &&
        Math.abs(window.innerHeight - stageH) < 160
      ) {
        return;
      }
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    const video = mediaType === 'video' ? mediaRef.current : null;
    const visibility = new IntersectionObserver(([entry]) => {
      if (!video) return;
      if (entry.isIntersecting) {
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }, { rootMargin: '200px 0px' });
    if (video) visibility.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      visibility.disconnect();
    };
    // Re-run when frame/title geometry props change so the fitted title size stays correct.
  }, [applyProgress, useWindowScroll, mediaType, startWidth, startHeight, titleMode, title]);

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    );

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${revealMode === 'curtains' ? 'scroll-expand--curtains' : ''} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {revealMode === 'curtains'
            ? ['top', 'bottom', 'left', 'right'].map((side, i) => (
                <div
                  key={side}
                  ref={el => (curtainRefs.current[i] = el)}
                  className={`scroll-expand__curtain scroll-expand__curtain--${side}`}
                  style={{ background: curtainColor }}
                  aria-hidden="true"
                />
              ))
            : null}
          {title ? (
            <div
              ref={titleRef}
              className={`scroll-expand__title ${titleMode === 'grow' ? 'scroll-expand__title--grow' : ''}`.trim()}
            >
              <span ref={titleTextRef}>{title}</span>
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
