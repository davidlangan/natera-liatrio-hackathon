/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.microlink.io" },
      { protocol: "https", hostname: "api.microlink.io" },
      { protocol: "https", hostname: "image.thum.io" },
      { protocol: "https", hostname: "**.gitlab.com" },
      { protocol: "https", hostname: "gitlab.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
