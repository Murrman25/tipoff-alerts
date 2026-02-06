import { Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type NotificationChannel = "email" | "push" | "sms";

interface AlertNotificationChannelsProps {
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
}

const channels = [
  {
    id: "push" as NotificationChannel,
    label: "Push",
    description: "In-app and browser notifications",
    icon: Bell,
  },
  {
    id: "email" as NotificationChannel,
    label: "Email",
    description: "Get notified via email",
    icon: Mail,
    badge: "Legend",
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
        <div className="flex items-center gap-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isSelected = selectedChannels.includes(channel.id);
            
            return (
              <Popover key={channel.id}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggle(channel.id);
                    }}
                    aria-pressed={isSelected}
                    aria-label={`Toggle ${channel.label} notifications. ${channel.description}`}
                    className={cn(
                      "h-10 sm:h-9 px-4 sm:px-3 gap-2 sm:gap-1.5 transition-all duration-200",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground" 
                        : "bg-transparent hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{channel.label}</span>
                    {channel.badge && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium ml-0.5">
                        {channel.badge}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  side="bottom" 
                  align="center"
                  className="w-auto p-2 text-xs"
                >
                  {channel.description}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
      {selectedChannels.length === 0 && (
        <p className="text-xs text-amber-500">Select at least one notification channel</p>
      )}
    </div>
  );
};
