/**
 * Server-side environment access. Optional integrations return `undefined`
 * rather than throwing so the site keeps working without them.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export const env = {
  get siteUrl() {
    return (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get sessionSecret() {
    const secret = read("SESSION_SECRET");
    if (!secret || secret.length < 32) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
      }
      return "development-only-secret-change-me-0000000000";
    }
    return secret;
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  github: {
    get username() {
      return read("GITHUB_USERNAME") ?? "jainish1510";
    },
    get token() {
      return read("GITHUB_TOKEN");
    },
  },
  spotify: {
    get clientId() {
      return read("SPOTIFY_CLIENT_ID");
    },
    get clientSecret() {
      return read("SPOTIFY_CLIENT_SECRET");
    },
    get refreshToken() {
      return read("SPOTIFY_REFRESH_TOKEN");
    },
    get configured() {
      return Boolean(read("SPOTIFY_CLIENT_ID") && read("SPOTIFY_CLIENT_SECRET") && read("SPOTIFY_REFRESH_TOKEN"));
    },
  },
};
