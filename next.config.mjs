/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "web.sit.ac.in" },
      { protocol: "https", hostname: "ssit.edu.in" },
      { protocol: "https", hostname: "bpwkqodasqcjbulkstrt.supabase.co" }
    ]
  }
};

export default nextConfig;
