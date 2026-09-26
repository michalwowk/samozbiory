import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        // ADR 0011 makes Polish the unprefixed default, so `/` is canonical. Without this, `/pl/...`
        // also answers 200 and every location page exists at two URLs — duplicate content on a product
        // whose distribution is search. next-intl has no option for this; Next's own proxy docs point
        // at `redirects` for exactly this case.
        source: "/pl/:path+",
        destination: "/:path*",
        permanent: true,
      },
      { source: "/pl", destination: "/", permanent: true },
    ];
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
