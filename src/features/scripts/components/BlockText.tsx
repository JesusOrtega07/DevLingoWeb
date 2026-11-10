import InlineText from "./InlineText";
import type { Block } from "@/features/scripts/types";

// Bloques (párrafos, listas, citas, código) del árbol cerrado del parser.

type BlockProps = { blocks: Block[] };

const BlockText = ({ blocks }: BlockProps) => (
  <>
    {blocks.map((block, i) => {
      switch (block.type) {
        case "paragraph":
          return (
            <p key={i} className="m-0">
              <InlineText nodes={block.children} />
            </p>
          );
        case "list": {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={i} className={`m-0 flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <BlockText blocks={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        case "quote":
          return (
            <blockquote key={i} className="m-0 border-l-2 border-gold pl-4">
              <BlockText blocks={block.children} />
            </blockquote>
          );
        case "codeBlock":
          return (
            <pre key={i} className="m-0 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[13px]">
              {block.value}
            </pre>
          );
        default:
          return null;
      }
    })}
  </>
);

export default BlockText;
