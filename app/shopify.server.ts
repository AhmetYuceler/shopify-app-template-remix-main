import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Derive appUrl from multiple environment variables so deployments don't crash
// if SHOPIFY_APP_URL isn't explicitly set at runtime.
function deriveAppUrl() {
  // Prefer explicit app URLs, but consider HOST if it looks like a hostname (Railway sets RAILWAY_PUBLIC_DOMAIN)
  const rawHost = process.env.HOST;
  const isBadHost = (h?: string) =>
    !h || /^(0\.0\.0\.0|127\.0\.0\.1|localhost|\d{1,3}(?:\.\d{1,3}){3})$/i.test(h);

  const candidates = [
    process.env.SHOPIFY_APP_URL,
    process.env.APP_URL,
    !isBadHost(rawHost) ? rawHost : undefined,
    // Common PaaS envs
    process.env.RENDER_EXTERNAL_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined,
    process.env.RAILWAY_STATIC_URL,
  ].filter(Boolean) as string[];

  let url = candidates[0] || "";

  // Normalize: ensure protocol and no trailing slash
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/$/, "");

  if (process.env.DEBUG_SHOPIFY_ENV === "true") {
    // eslint-disable-next-line no-console
    console.log("[shopify-app][env-debug] Resolved appUrl=", url || "<empty>");
  }

  return url;
}

// Normalize and validate critical env vars with fallbacks to avoid misconfigurations
// Railway variables might be injected differently; attempt multiple common names.
const resolvedApiKey =
  process.env.SHOPIFY_API_KEY?.trim() ||
  process.env.SHOPIFY_PUBLIC_API_KEY?.trim() ||
  (process.env as any).API_KEY?.trim() || // fallback if user created generic key
  "";

const resolvedApiSecret =
  process.env.SHOPIFY_API_SECRET_KEY?.trim() ||
  (process.env as any).SHOPIFY_API_SECRET?.trim() ||
  (process.env as any).SHOPIFY_SECRET?.trim() ||
  (process.env as any).API_SECRET?.trim() || // generic fallback
  "";

if (!resolvedApiKey || !resolvedApiSecret) {
  const missing: string[] = [];
  if (!resolvedApiKey) missing.push("SHOPIFY_API_KEY (or SHOPIFY_PUBLIC_API_KEY)");
  if (!resolvedApiSecret) missing.push("SHOPIFY_API_SECRET_KEY (or SHOPIFY_API_SECRET / SHOPIFY_SECRET)");
  // Log presence without leaking sensitive values
  // eslint-disable-next-line no-console
  console.error(
    `[shopify-app] Missing required env vars: ${missing.join(", ")}. Present? ` +
      `apiKey=${!!process.env.SHOPIFY_API_KEY || !!process.env.SHOPIFY_PUBLIC_API_KEY}, ` +
      `apiSecret=${!!process.env.SHOPIFY_API_SECRET_KEY || !!(process.env as any).SHOPIFY_API_SECRET || !!(process.env as any).SHOPIFY_SECRET}`
  );
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      `Set these in your deployment environment (e.g., Railway Variables).`
  );
}

const shopify = shopifyApp({
  apiKey: resolvedApiKey,
  apiSecretKey: resolvedApiSecret,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: deriveAppUrl(),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// Optional diagnostic logging to help debug missing env vars in hosted environments like Railway.
if (process.env.DEBUG_SHOPIFY_ENV === "true") {
  // eslint-disable-next-line no-console
  console.log(
    "[shopify-app][env-debug] Available env keys:",
    Object.keys(process.env)
      .filter((k) => k.startsWith("SHOPIFY") || ["HOST", "SCOPES"].includes(k))
      .sort()
      .join(", ")
  );
}

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
