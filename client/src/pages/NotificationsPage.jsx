import { Bell } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export function NotificationsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Signal centre"
        title="Notifications"
        description="Execution updates and account events will appear here after a notification service is connected."
      />
      <Card>
        <EmptyState icon={<Bell className="size-5" />} title="No notifications" description="OctaTrade does not have a notification endpoint yet." />
      </Card>
    </div>
  );
}
