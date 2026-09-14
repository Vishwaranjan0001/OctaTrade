import { Skeleton } from "../ui/States.jsx";

/**
 * RouteFallback — Suspense fallback for lazily loaded routes.
 *
 * Purpose : a route chunk arriving late must not collapse the layout. This
 *           reserves a page-shaped block of the same proportions so the
 *           transition does not shift content.
 * Input   : label for assistive tech.
 * Output  : an aria-busy placeholder page.
 */
export function RouteFallback({ label = "Loading" }) {
  return (
    <div className="ot-route-fallback" role="status" aria-busy="true">
      <span className="ot-sr">{label}</span>
      <div className="ot-route-fallback__inner">
        <Skeleton height={11} width={120} />
        <Skeleton height={38} width="46%" />
        <div className="ot-route-fallback__row">
          <Skeleton height={92} />
          <Skeleton height={92} />
          <Skeleton height={92} />
        </div>
        <Skeleton height={260} />
      </div>
    </div>
  );
}
