import { Mail, Bell, MessageSquare } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
    label: "Push",
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
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Notify via
        </span>
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isSelected = selectedChannels.includes(channel.id);
              
              return (
                <Tooltip key={channel.id}>
                  <TooltipTrigger asChild>
                    <Toggle
                      pressed={isSelected}
                      onPressedChange={() => handleToggle(channel.id)}
                      aria-label={`Toggle ${channel.label} notifications`}
                      className={cn(
                        "h-9 px-3 gap-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                        "border border-border hover:bg-secondary/50",
                        "transition-all duration-200"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{channel.label}</span>
                      {channel.badge && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-gradient text-primary-foreground font-medium ml-0.5">
                          {channel.badge}
                        </span>
                      )}
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {channel.description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
      {selectedChannels.length === 0 && (
        <p className="text-xs text-amber-500">Select at least one notification channel</p>
      )}
    </div>
  );
};
