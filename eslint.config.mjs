import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off dev/seed/codemod tooling — not part of the shipped app. These are
    // CommonJS Node scripts run ad-hoc via tsx and aren't worth gating CI on.
    "scripts/**",
  ]),
  {
    rules: {
      // Dataverse returns untyped JSON at the boundary, so `any` is pragmatic in the
      // data layer (and already widely eslint-disabled). Keep it visible as a warning
      // (tracked tech debt) rather than failing the build.
      "@typescript-eslint/no-explicit-any": "warn",
      // Mostly legitimate initial-load / state-sync effects. Useful as a hint, but not
      // a correctness error worth blocking CI on.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
