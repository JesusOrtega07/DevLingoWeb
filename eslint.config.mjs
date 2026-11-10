import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Componentes, páginas y layouts siempre como arrow functions (ver CLAUDE.md).
      "react/function-component-definition": [
        "error",
        { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
      ],
      // Nunca dangerouslySetInnerHTML.
      "react/no-danger": "error",
      // Nunca SQL sin parametrizar.
      "no-restricted-properties": [
        "error",
        { property: "$queryRawUnsafe", message: "Prohibido: usa Prisma o $queryRaw parametrizado." },
        { property: "$executeRawUnsafe", message: "Prohibido: usa Prisma o $executeRaw parametrizado." },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
