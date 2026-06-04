import type { NextConfig } from "next";

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

// Parse hostname from the R2 public URL (e.g. pub-xxx.r2.dev)
function storageHostname(): string | null {
  try {
    return storageUrl ? new URL(storageUrl).hostname : null;
  } catch {
    return null;
  }
}

const hostname = storageHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket URL
      ...(hostname
        ? [{ protocol: "https" as const, hostname }]
        : []),
      // R2 custom domains — add more entries here if you set up a custom domain
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
};

export default nextConfig;
