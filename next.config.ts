import type { NextConfig } from "next";

import { isSupabaseConfigured } from "./lib/supabase/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseRemotePattern = isSupabaseConfigured() && supabaseUrl
  ? (() => {
      const parsedUrl = new URL(supabaseUrl);
      if (parsedUrl.protocol === "https:") {
        return {
          protocol: "https" as const,
          hostname: parsedUrl.hostname,
          pathname: "/storage/v1/object/public/product-images/**",
        };
      }
      if (parsedUrl.protocol === "http:") {
        return {
          protocol: "http" as const,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          pathname: "/storage/v1/object/public/product-images/**",
        };
      }
      throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.");
    })()
  : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: supabaseRemotePattern ? [supabaseRemotePattern] : [],
  },
};

export default nextConfig;
