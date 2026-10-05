import { useState } from "react";
import { Bell, Database, Moon, Palette, Shield, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Card, PageHeader, SectionHeader } from "@/components/ui";

export function SettingsPage() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const [preferences, setPreferences] = useState({ orderUpdates: true, marketBrief: true, compactNumbers: false });

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Workspace" title="Settings" description="Personalize the OctaTrade experience without changing your trading records." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Appearance" description="Choose the theme that feels best for your workspace" action={<Palette className="size-4 text-brand-500" />} />
          <div className="grid grid-cols-2 gap-3">
            {["dark", "light"].map((option) => {
              const active = theme === option;
              const Icon = option === "dark" ? Moon : Sun;
              return <button key={option} onClick={() => !active && toggleTheme()} className={cn("rounded-2xl border p-4 text-left transition", active ? "border-brand-500/50 bg-brand-500/8" : "border-[var(--line)] hover:bg-[var(--panel-muted)]")}><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[var(--panel-muted)] text-brand-500"><Icon className="size-5" /></span>{active ? <Badge tone="positive">Active</Badge> : null}</div><p className="mt-5 text-sm font-semibold capitalize">{option} mode</p><p className="mt-1 text-xs text-[var(--text-muted)]">{option === "dark" ? "Focused terminal contrast" : "Clear daylight workspace"}</p></button>;
            })}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader title="Notification preferences" description="These controls are saved for this browser session" action={<Bell className="size-4 text-brand-500" />} />
          <div className="space-y-3">
            {[["orderUpdates", "Order updates", "Execution and rejection messages"], ["marketBrief", "Market briefing", "Preview summaries and session notices"], ["compactNumbers", "Compact values", "Show shortened values in dashboard cards"]].map(([key, title, description]) => (
              <button key={key} onClick={() => setPreferences((current) => ({ ...current, [key]: !current[key] }))} className="flex w-full items-center gap-4 rounded-xl border border-[var(--line)] p-4 text-left transition hover:bg-[var(--panel-muted)]"><span className="flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-1 block text-[10px] text-[var(--text-muted)]">{description}</span></span><span className={cn("relative h-6 w-11 rounded-full transition", preferences[key] ? "bg-brand-500" : "bg-[var(--panel-muted)] ring-1 ring-[var(--line)]")}><span className={cn("absolute top-1 size-4 rounded-full bg-white shadow transition", preferences[key] ? "left-6" : "left-1")} /></span></button>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader title="Security" description="Current application protections" action={<Shield className="size-4 text-brand-500" />} />
          <div className="space-y-3 text-xs text-[var(--text-muted)]"><div className="flex items-center justify-between rounded-xl bg-[var(--panel-muted)] p-4"><span>Private API authentication</span><Badge tone="positive">Enabled</Badge></div><div className="flex items-center justify-between rounded-xl bg-[var(--panel-muted)] p-4"><span>Paper trading mode</span><Badge tone="info">Active</Badge></div></div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader title="Data connections" description="Services powering this workspace" action={<Database className="size-4 text-brand-500" />} />
          <div className="space-y-3 text-xs text-[var(--text-muted)]"><div className="flex items-center justify-between rounded-xl bg-[var(--panel-muted)] p-4"><span>OctaTrade Express API</span><Badge tone="positive">Connected</Badge></div><div className="flex items-center justify-between rounded-xl bg-[var(--panel-muted)] p-4"><span>Historical analytics feed</span><Badge tone="warning">Preview</Badge></div></div>
        </Card>
      </div>
    </div>
  );
}
