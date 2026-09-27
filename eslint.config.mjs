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
    "public/wasm/**",
    "public/emotion-weather/**",
    "tools/verify-step-enter.js",
    // Separate/retained legacy experiences are outside the competition runtime.
    "AR/**",
    "src/components/agents/**",
    "src/components/badges/**",
    "src/components/diary/**",
    "src/components/experience/**",
    "src/components/flow/**",
    "src/components/game/**",
    "src/components/gesture/**",
    "src/components/profile/**",
    "src/components/three/**",
    "src/hooks/use-experience-gesture.ts",
    "src/hooks/use-gesture-detection.ts",
    "src/hooks/use-journiv-diary.ts",
    "src/hooks/use-user-profile.ts",
  ]),
]);

export default eslintConfig;
