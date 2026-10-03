import { bus } from "@/lib/events/bus";
import { resetRateLimits } from "@/lib/security/rate-limit";
import { beforeEach } from "vitest";

beforeEach(() => {
  resetRateLimits();
});

export { bus };
