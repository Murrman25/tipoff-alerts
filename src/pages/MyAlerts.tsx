import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Plus, Bell, Trash2, ToggleLeft, ToggleRight, Loader2, FileText } from "lucide-react";
import { PageGlow } from "@/components/PageGlow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockGames } from "@/data/mockGames";
import { MARKET_OPTIONS, RULE_TYPE_OPTIONS, AlertTemplate, AlertTemplateInput } from "@/types/alerts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TemplateCard, CreateTemplateModal } from "@/components/alerts";
import { useAlertTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useAlertTemplates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Alert {
  id: string;
  rule_type: string;
  event_id: string | null;
  market_type: string;
  team_side: string | null;
  threshold: number | null;
  direction: string;
  time_window: string;
  is_active: boolean;
  created_at: string;
  channels: string[];
}

const MyAlerts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Template state
  const { data: templates = [], isLoading: templatesLoading } = useAlertTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AlertTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/alerts");
    }
  }, [user, authLoading, navigate]);

  // Fetch alerts from database
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;

      try {
        // Fetch alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from("alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (alertsError) throw alertsError;

        // Fetch channels for all alerts
        const alertIds = alertsData.map((a) => a.id);
        const { data: channelsData, error: channelsError } = await supabase
          .from("alert_notification_channels")
          .select("*")
          .in("alert_id", alertIds);

        if (channelsError) throw channelsError;

        // Map channels to alerts
        const alertsWithChannels = alertsData.map((alert) => ({
          ...alert,
          channels: channelsData
            .filter((c) => c.alert_id === alert.id && c.is_enabled)
            .map((c) => c.channel_type),
        }));

        setAlerts(alertsWithChannels);
      } catch (error: any) {
        toast.error("Failed to load alerts");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const getGameInfo = (eventId: string | null) => {
    if (!eventId) return null;
    return mockGames.find((g) => g.eventID === eventId);
  };

  const getRuleTypeName = (ruleType: string) => {
    return RULE_TYPE_OPTIONS.find((r) => r.id === ruleType)?.name || ruleType;
  };

  const getMarketName = (marketType: string) => {
    return MARKET_OPTIONS.find((m) => m.id === marketType)?.abbreviation || marketType;
  };

  const getChannelBadge = (channel: string) => {
    const styles: Record<string, string> = {
      email: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      push: "bg-green-500/20 text-green-400 border-green-500/30",
      sms: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
    return styles[channel] || "bg-muted";
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;

    const newStatus = !alert.is_active;

    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: newStatus } : a))
    );

    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_active: newStatus })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      // Revert on error
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !newStatus } : a))
      );
      toast.error("Failed to update alert");
    }
  };

  const deleteAlert = async (id: string) => {
    const alertToDelete = alerts.find((a) => a.id === id);
    if (!alertToDelete) return;

    // Optimistic update
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    try {
      const { error } = await supabase.from("alerts").delete().eq("id", id);

      if (error) throw error;
      toast.success("Alert deleted");
    } catch (error) {
      // Revert on error
      setAlerts((prev) => [...prev, alertToDelete]);
      toast.error("Failed to delete alert");
    }
  };

  // Template handlers
  const handleEditTemplate = (template: AlertTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteTemplate = () => {
    if (deleteConfirmId) {
      deleteTemplate.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleSaveTemplate = (input: AlertTemplateInput) => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...input }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }
      });
    } else {
      createTemplate.mutate(input, {
        onSuccess: () => {
          setIsModalOpen(false);
        }
      });
    }
  };

  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const activeAlerts = alerts.filter((a) => a.is_active);
  const inactiveAlerts = alerts.filter((a) => !a.is_active);

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const game = getGameInfo(alert.event_id);
    const teamName = game
      ? alert.team_side === "home"
        ? game.teams.home.name
        : game.teams.away.name
      : "Unknown Team";

    return (
      <Card className={`bg-card border-border transition-opacity ${!alert.is_active ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Rule type and market */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  {getRuleTypeName(alert.rule_type)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getMarketName(alert.market_type)}
                </Badge>
                {alert.time_window === "live" && (
                  <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    Live Only
                  </Badge>
                )}
              </div>

              {/* Team and threshold */}
              <div className="text-sm">
                <span className="font-medium">{teamName}</span>
                {alert.threshold !== null && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {alert.threshold >= 0 ? "+" : ""}
                    {alert.threshold}
                  </span>
                )}
              </div>

              {/* Game info */}
              {game && (
                <p className="text-xs text-muted-foreground">
                  {game.teams.away.abbreviation} @ {game.teams.home.abbreviation} • {game.leagueID}
                </p>
              )}

              {/* Notification channels */}
              <div className="flex items-center gap-1.5 pt-1">
                {alert.channels.map((channel) => (
                  <Badge
                    key={channel}
                    variant="outline"
                    className={`text-xs capitalize ${getChannelBadge(channel)}`}
                  >
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleAlert(alert.id)}
                className="h-8 w-8"
              >
                {alert.is_active ? (
                  <ToggleRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteAlert(alert.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show loading while checking auth
  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PageGlow />
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container px-4 md:px-6">
          <div className="flex items-center h-16 gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex-1 flex justify-center">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                My Alerts
              </h1>
            </div>
            <Link to="/alerts/create">
              <Button size="sm" className="bg-gold-gradient text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-1" />
                New Alert
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8 max-w-2xl mx-auto">
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Active ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Inactive ({inactiveAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeAlerts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No active alerts</p>
                  <Link to="/alerts/create">
                    <Button className="bg-gold-gradient text-primary-foreground hover:opacity-90">
                      <Zap className="w-4 h-4 mr-2" />
                      Create Alert
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              activeAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-3">
            {inactiveAlerts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No inactive alerts
                </CardContent>
              </Card>
            ) : (
              inactiveAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-3">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-2">No templates yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create templates for one-tap alert setup
                  </p>
                  <Button 
                    onClick={handleOpenNewTemplate}
                    className="bg-gold-gradient text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenNewTemplate}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                </div>
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit Template Modal */}
      <CreateTemplateModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
        onSave={handleSaveTemplate}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyAlerts;
