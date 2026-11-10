import { Fragment } from "react";

import { curlyQuotes } from "@/features/interviews/context-view";
import type { Inline } from "@/features/scripts/types";

type Props = { nodes: Inline[] };

// Como InlineText, pero las citas en cursiva (*"…"*) se muestran en dorado con comillas
// tipográficas, como las frases que Lili debe decir en el mockup 04.
const QuoteText = ({ nodes }: Props) => (
  <>
    {nodes.map((node, i) => {
      switch (node.type) {
        case "text":
          return <Fragment key={i}>{curlyQuotes(node.value)}</Fragment>;
        case "emphasis":
          return (
            <span key={i} className="font-semibold text-gold">
              <QuoteText nodes={node.children} />
            </span>
          );
        case "strong":
          return (
            <strong key={i} className="font-bold">
              <QuoteText nodes={node.children} />
            </strong>
          );
        case "code":
          return (
            <code key={i} className="font-mono">
              {node.value}
            </code>
          );
        case "link":
          return node.url.startsWith("https://") ? (
            <a key={i} href={node.url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline">
              <QuoteText nodes={node.children} />
            </a>
          ) : (
            <QuoteText key={i} nodes={node.children} />
          );
        case "break":
          return <br key={i} />;
        default:
          return null;
      }
    })}
  </>
);

export default QuoteText;
