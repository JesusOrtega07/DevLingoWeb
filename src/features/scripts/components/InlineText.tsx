import { Fragment } from "react";

import type { Inline } from "@/features/scripts/types";

// Renderiza el árbol cerrado del parser a elementos de React.
// No hay ningún camino que produzca HTML crudo: solo estos elementos y texto escapado por React.

type InlineProps = { nodes: Inline[] };

const InlineText = ({ nodes }: InlineProps) => (
  <>
    {nodes.map((node, i) => {
      switch (node.type) {
        case "text":
          return <Fragment key={i}>{node.value}</Fragment>;
        case "emphasis":
          return (
            <em key={i}>
              <InlineText nodes={node.children} />
            </em>
          );
        case "strong":
          return (
            <strong key={i} className="font-semibold">
              <InlineText nodes={node.children} />
            </strong>
          );
        case "code":
          return (
            <code key={i} className="rounded bg-ink px-1 font-mono text-[0.9em]">
              {node.value}
            </code>
          );
        case "link":
          // El parser solo deja pasar https://; se revalida aquí por si el JSON viniera de otra parte.
          return node.url.startsWith("https://") ? (
            <a key={i} href={node.url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline hover:text-cream">
              <InlineText nodes={node.children} />
            </a>
          ) : (
            <InlineText key={i} nodes={node.children} />
          );
        case "break":
          return <br key={i} />;
        default:
          return null;
      }
    })}
  </>
);

export default InlineText;
