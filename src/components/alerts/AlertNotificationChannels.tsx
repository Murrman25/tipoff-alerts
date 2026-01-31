import { Mail, Bell, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type NotificationChannel = "email" | "push" | "sms";

interface AlertNotificationChannelsProps {
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
}

const channels = [
  {
    id: "email" as NotificationChannel,
    label: "Email",
    description: "Get notified via email",
    icon: Mail,
  },
  {
    id: "push" as NotificationChannel,
    label: "Push Notification",
    description: "In-app and browser notifications",
    icon: Bell,
  },
  {
    id: "sms" as NotificationChannel,
    label: "SMS",
    description: "Text message alerts",
    icon: MessageSquare,
    badge: "Pro",
  },
];

export const AlertNotificationChannels = ({
  selectedChannels,
  onChange,
}: AlertNotificationChannelsProps) => {
  const handleToggle = (channelId: NotificationChannel) => {
    if (selectedChannels.includes(channelId)) {
      onChange(selectedChannels.filter((c) => c !== channelId));
    } else {
      onChange([...selectedChannels, channelId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Notification Delivery
      </label>
      <div className="grid gap-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isSelected = selectedChannels.includes(channel.id);
          
          return (
            <div
              key={channel.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-muted-foreground/50"
              }`}
              onClick={() => handleToggle(channel.id)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(channel.id)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium cursor-pointer">{channel.label}</Label>
                  {channel.badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-gradient text-primary-foreground font-medium">
                      {channel.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{channel.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      {selectedChannels.length === 0 && (
        <p className="text-xs text-amber-500">Select at least one notification channel</p>
      )}
    </div>
  );
};
