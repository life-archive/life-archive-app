import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/laf/**", search: "" },
      { pathname: "/life-files/**", search: "" },
      { pathname: "/life-albums/**", search: "" },
      { pathname: "/life-album-thumbs/**", search: "" },
    ],
  },
};

export default nextConfig;
