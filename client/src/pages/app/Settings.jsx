import { Monitor, Moon, Sun, Trash2 } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { SegmentedControl } from "../../components/ui/Field.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useUiStore } from "../../store/uiStore.js";
import { useWatchlistStore } from "../../store/watchlistStore.js";
import { useRecentSymbolsStore } from "../../store/recentSymbolsStore.js";
import { useMotionPreference } from "../../hooks/useMotionPreference.js";
import { toast } from "../../components/ui/Toast.jsx";

/**
 * Settings — interface preferences.
 *
 * Purpose : the controls that genuinely exist: theme, interface motion, table
 *           density, and clearing the device-local lists. Each is stored in
 *           this browser, which the page states plainly rather than implying
 *           account-level sync.
 * Input   : none.
 * Output  : the settings page.
 */
export default function Settings() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const compactRows = useUiStore((state) => state.compactRows);
  const setCompactRows = useUiStore((state) => state.setCompactRows);

  const { motionEnabled, prefersReducedMotion } = useMotionPreference();
  const setMotionEnabled = useUiStore((state) => state.setMotionEnabled);

  const clearWatchlist = useWatchlistStore((state) => state.clear);
  const watchlistCount = useWatchlistStore((state) => state.symbols.length);
  const clearRecent = useRecentSymbolsStore((state) => state.clear);
  const recentCount = useRecentSymbolsStore((state) => state.symbols.length);

  return (
    <div className="ot-stack">
      <PageHeader
        title="Settings"
        source="Stored in this browser"
        lede="Interface preferences for this device. The OctaTrade API stores no user preferences, so nothing here follows you to another browser."
      />

      <div className="ot-grid ot-grid--2">
        <Panel>
          <PanelHeader
            title="Appearance"
            description="The workspace and all charts follow this setting."
          />
          <PanelBody>
            <div className="ot-setting">
              <div className="ot-setting__text">
                <p className="ot-setting__label">Theme</p>
                <p className="ot-setting__hint">
                  Dark is the trading default. Light uses a cold paper palette
                  for daylight desks.
                </p>
              </div>
              <SegmentedControl
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "dark", label: "Dark", icon: <Moon size={13} aria-hidden="true" /> },
                  { value: "light", label: "Light", icon: <Sun size={13} aria-hidden="true" /> },
                  { value: "system", label: "System", icon: <Monitor size={13} aria-hidden="true" /> }
                ]}
              />
            </div>

            <div className="ot-setting">
              <div className="ot-setting__text">
                <p className="ot-setting__label">Table density</p>
                <p className="ot-setting__hint">
                  Compact rows fit more of a blotter on screen.
                </p>
              </div>
              <SegmentedControl
                label="Table density"
                value={compactRows ? "compact" : "comfortable"}
                onChange={(value) => setCompactRows(value === "compact")}
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" }
                ]}
              />
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Motion"
            description="Controls scroll smoothing, transitions and the animated hero scene."
          />
          <PanelBody>
            <div className="ot-setting">
              <div className="ot-setting__text">
                <p className="ot-setting__label">Interface motion</p>
                <p className="ot-setting__hint">
                  {prefersReducedMotion
                    ? "Your system requests reduced motion, so animation is already disabled regardless of this setting."
                    : "Turning motion off disables smooth scrolling, transitions and the 3D scene."}
                </p>
              </div>
              <SegmentedControl
                label="Interface motion"
                value={motionEnabled ? "on" : "off"}
                onChange={(value) => setMotionEnabled(value === "on")}
                options={[
                  { value: "on", label: "On" },
                  { value: "off", label: "Off" }
                ]}
              />
            </div>

            {prefersReducedMotion ? (
              <SourceNotice>
                Reduced motion is active from your operating system setting.
                OctaTrade respects it everywhere, including the landing page.
              </SourceNotice>
            ) : null}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Device data"
          description="Lists OctaTrade keeps in this browser because the API has no endpoint for them."
        />
        <PanelBody>
          <div className="ot-setting">
            <div className="ot-setting__text">
              <p className="ot-setting__label">Watchlist</p>
              <p className="ot-setting__hint">
                {watchlistCount === 0
                  ? "No symbols saved."
                  : `${watchlistCount} symbol${watchlistCount === 1 ? "" : "s"} saved on this device.`}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={watchlistCount === 0}
              onClick={() => {
                clearWatchlist();
                toast.info("Watchlist cleared");
              }}
              iconLeft={<Trash2 size={14} aria-hidden="true" />}
            >
              Clear
            </Button>
          </div>

          <div className="ot-setting">
            <div className="ot-setting__text">
              <p className="ot-setting__label">Recent symbol lookups</p>
              <p className="ot-setting__hint">
                {recentCount === 0
                  ? "No lookups recorded."
                  : `${recentCount} recent symbol${recentCount === 1 ? "" : "s"}.`}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={recentCount === 0}
              onClick={() => {
                clearRecent();
                toast.info("Recent lookups cleared");
              }}
              iconLeft={<Trash2 size={14} aria-hidden="true" />}
            >
              Clear
            </Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
