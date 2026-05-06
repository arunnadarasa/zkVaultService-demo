import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

if (
  "localStorage" in globalThis &&
  typeof (
    globalThis as { localStorage?: { getItem?: unknown } }
  ).localStorage?.getItem !== "function"
) {
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

export default nextConfig;
