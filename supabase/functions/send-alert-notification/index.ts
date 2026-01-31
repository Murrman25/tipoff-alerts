import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertNotificationRequest {
  email: string;
  alertDetails: {
    eventName: string;
    teamSide: string;
    teamName: string;
    marketType: string;
    threshold: number | null;
    direction: string;
    ruleType: string;
    currentValue: number;
    previousValue?: number;
  };
}

const formatMarketType = (type: string): string => {
  const marketTypes: Record<string, string> = {
    sp: "Spread",
    ml: "Moneyline",
    ou: "Over/Under",
  };
  return marketTypes[type] || type.toUpperCase();
};

const formatDirection = (direction: string): string => {
  const directions: Record<string, string> = {
    at_or_above: "at or above",
    at_or_below: "at or below",
    crosses_above: "crossed above",
    crosses_below: "crossed below",
  };
  return directions[direction] || direction;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, alertDetails }: AlertNotificationRequest = await req.json();
    console.log("Sending alert notification to:", email);
    console.log("Alert triggered:", alertDetails);

    // Validate required fields
    if (!email || !alertDetails) {
      throw new Error("Missing required fields: email and alertDetails");
    }

    const thresholdDisplay = alertDetails.threshold !== null 
      ? (alertDetails.threshold > 0 ? `+${alertDetails.threshold}` : alertDetails.threshold.toString())
      : "N/A";

    const currentValueDisplay = alertDetails.currentValue > 0 
      ? `+${alertDetails.currentValue}` 
      : alertDetails.currentValue.toString();

    const previousValueDisplay = alertDetails.previousValue !== undefined
      ? (alertDetails.previousValue > 0 ? `+${alertDetails.previousValue}` : alertDetails.previousValue.toString())
      : null;

    const movementText = previousValueDisplay 
      ? `moved from ${previousValueDisplay} to ${currentValueDisplay}`
      : `is now at ${currentValueDisplay}`;

    const emailResponse = await resend.emails.send({
      from: "LineShift Alerts <onboarding@resend.dev>",
      to: [email],
      subject: `🚨 Alert Triggered: ${alertDetails.teamName} ${formatMarketType(alertDetails.marketType)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1f 0%, #0a0a0b 100%); border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
            
            <!-- Header - Red for urgency -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🚨 Alert Triggered!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="color: #f4f4f5; font-size: 18px; margin: 0 0 8px 0; font-weight: 600; line-height: 1.4;">
                ${alertDetails.teamName} ${formatMarketType(alertDetails.marketType)}
              </p>
              <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0; line-height: 1.5;">
                The line ${movementText} and has ${formatDirection(alertDetails.direction)} your threshold of <strong style="color: #f59e0b;">${thresholdDisplay}</strong>.
              </p>
              
              <!-- Alert Details Card -->
              <div style="background-color: #18181b; border-radius: 12px; padding: 20px; border: 1px solid #dc2626; margin-bottom: 20px;">
                <div style="margin-bottom: 16px;">
                  <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Event</span>
                  <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">${alertDetails.eventName}</p>
                </div>
                
                <div style="display: grid; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #27272a;">
                    <span style="color: #71717a; font-size: 14px;">Market</span>
                    <span style="color: #f4f4f5; font-size: 14px; font-weight: 500;">${formatMarketType(alertDetails.marketType)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #27272a;">
                    <span style="color: #71717a; font-size: 14px;">Your Threshold</span>
                    <span style="color: #f59e0b; font-size: 14px; font-weight: 600;">${thresholdDisplay}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #27272a;">
                    <span style="color: #71717a; font-size: 14px;">Current Value</span>
                    <span style="color: #22c55e; font-size: 16px; font-weight: 700;">${currentValueDisplay}</span>
                  </div>
                  ${previousValueDisplay ? `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                    <span style="color: #71717a; font-size: 14px;">Previous Value</span>
                    <span style="color: #a1a1aa; font-size: 14px;">${previousValueDisplay}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- CTA Button -->
              <a href="https://lineshift.app/games" style="display: block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                View Game Details →
              </a>
              
              <p style="color: #71717a; font-size: 13px; margin: 20px 0 0 0; text-align: center; line-height: 1.5;">
                This alert was triggered based on your saved preferences. Manage your alerts from your dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px 24px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #52525b; font-size: 12px; margin: 0;">
                LineShift • Sports Betting Alerts
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Alert notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending alert notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
