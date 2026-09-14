import { Logo } from "../../components/ui/Logo.jsx";

/**
 * AuthAside — the editorial panel beside the auth forms.
 *
 * Purpose : say plainly what an OctaTrade account is (virtual funds, real
 *           quotes, no market risk) and list the capabilities the API actually
 *           provides. Every row names a real endpoint; nothing is implied that
 *           the backend cannot do.
 * Input   : variant "login" | "register".
 * Output  : the aside content.
 */
export function AuthAside({ variant }) {
  return (
    <aside className="ot-auth__aside">
      {/* Static octagon geometry, drawn once as SVG. No animation here: the
          auth pages must stay completely still while typing. */}
      <svg
        className="ot-auth__aside-art"
        viewBox="0 0 400 400"
        aria-hidden="true"
        focusable="false"
      >
        {[168, 132, 96, 60].map((radius, index) => {
          const points = Array.from({ length: 8 }, (_, vertex) => {
            const angle = (Math.PI / 4) * vertex + Math.PI / 8;
            return `${200 + radius * Math.cos(angle)},${200 + radius * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon
              key={radius}
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth={index === 1 ? 1.4 : 1}
              opacity={0.1 + index * 0.05}
            />
          );
        })}
        <line x1="200" y1="32" x2="200" y2="368" stroke="currentColor" strokeWidth="1" opacity="0.08" />
        <line x1="32" y1="200" x2="368" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.08" />
        <circle cx="200" cy="200" r="3" fill="var(--accent)" />
      </svg>

      <div className="ot-auth__aside-head">
        <Logo size={26} />
        <h2 className="ot-auth__aside-title ot-display" style={{ marginTop: 28 }}>
          {variant === "register"
            ? "An account funded with virtual money, priced by the real market."
            : "Your positions, orders and wallet are exactly where you left them."}
        </h2>
        <p className="ot-auth__aside-body">
          OctaTrade is a paper-trading environment. Orders settle against live
          quotes and a simulated wallet ledger, so you can study order
          lifecycle and portfolio behaviour without capital at risk.
        </p>
      </div>

      <div className="ot-auth__spec">
        <div className="ot-auth__spec-row">
          <span className="ot-auth__spec-key">Quotes</span>
          <span className="ot-auth__spec-val">Live, per symbol</span>
        </div>
        <div className="ot-auth__spec-row">
          <span className="ot-auth__spec-key">Wallet</span>
          <span className="ot-auth__spec-val">Virtual INR, paise ledger</span>
        </div>
        <div className="ot-auth__spec-row">
          <span className="ot-auth__spec-key">Orders</span>
          <span className="ot-auth__spec-val">Market BUY / SELL</span>
        </div>
        <div className="ot-auth__spec-row">
          <span className="ot-auth__spec-key">Session</span>
          <span className="ot-auth__spec-val">Bearer token, protected routes</span>
        </div>
        <div className="ot-auth__spec-row">
          <span className="ot-auth__spec-key">Capital at risk</span>
          <span className="ot-auth__spec-val">None</span>
        </div>
      </div>
    </aside>
  );
}
