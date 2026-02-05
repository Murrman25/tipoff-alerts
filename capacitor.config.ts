import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.tipoffhq.tipoffhq",
  appName: "TIPOFFHQ",
  webDir: "dist",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
          allowNavigation: [
            "localhost",
            "127.0.0.1",
            "10.0.2.2",
            "tipoffhq.com",
            "*.tipoffhq.com",
            "*.vercel.app",
            "*.supabase.co",
            "*.supabase.com"
          ]
        }
      }
    : {})
};

export default config;
