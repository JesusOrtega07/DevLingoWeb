"use client";

import { useActionState, useRef, useState, useTransition } from "react";

import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { type ScriptUploadState, handleScriptUpload } from "@/features/admin/script-actions";
import ScriptPreview from "@/features/scripts/components/ScriptPreview";
import type { Issue } from "@/features/scripts/types";

const MAX_BYTES = 1024 * 1024;
const initialState: ScriptUploadState = { status: "idle" };

type Props = { interviewId: string; nextVersion: number };

const IssueList = ({ title, issues, tone }: { title: string; issues: Issue[]; tone: "danger" | "gold" }) => (
  <div
    role={tone === "danger" ? "alert" : "status"}
    className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm ${
      tone === "danger" ? "border-danger/40 bg-danger/10 text-danger" : "border-gold/40 bg-gold/10 text-cream"
    }`}
  >
    <span className="font-semibold">{title}</span>
    <ul className="m-0 flex flex-col gap-1 pl-5">
      {issues.map((issue, i) => (
        <li key={i}>
          {issue.line !== undefined && <span className="font-mono text-[12px] opacity-80">Line {issue.line}: </span>}
          {issue.message}
        </li>
      ))}
    </ul>
  </div>
);

// Subida en dos pasos: "Check file" muestra la vista previa; "Save" vuelve a enviar el mismo
// archivo y el servidor lo valida de nuevo antes de guardar una versión nueva.
const ScriptUploader = ({ interviewId, nextVersion }: Props) => {
  const [state, dispatch] = useActionState(handleScriptUpload, initialState);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = (intent: "preview" | "save", target: File | null = file) => {
    if (!target) return;
    const formData = new FormData();
    formData.set("interviewId", interviewId);
    formData.set("intent", intent);
    formData.set("file", target);
    startTransition(() => dispatch(formData));
  };

  const onPick = (picked: File | null) => {
    setLocalError(null);
    if (picked && !/\.md$/i.test(picked.name)) {
      setLocalError("Only .md files are allowed.");
      setFile(null);
      return;
    }
    if (picked && picked.size > MAX_BYTES) {
      setLocalError("The file is larger than 1 MB.");
      setFile(null);
      return;
    }
    setFile(picked);
    send("preview", picked);
  };

  const reset = () => {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const showPreview = state.status === "preview" && file && state.fileName === file.name.trim();
  const hasErrors = Boolean(state.errors?.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="script-file" className="text-sm font-semibold">
          Script file (.md, max 1 MB)
        </label>
        <input
          ref={inputRef}
          id="script-file"
          type="file"
          accept=".md,text/markdown"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="rounded-xl border border-dashed border-line bg-ink px-4 py-3 font-sans text-sm text-cream/80 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:font-sans file:text-sm file:font-bold file:text-ink"
        />
      </div>

      {isPending && <p className="m-0 text-sm text-cream/66">Checking the file…</p>}
      <FormMessage error={localError ?? (state.status === "error" ? state.error : undefined)} />

      {state.status === "saved" && !isPending && (
        <FormMessage message={`Saved as version ${state.version}. It is now the current script.`} />
      )}

      {showPreview && !isPending && (
        <div className="flex flex-col gap-5">
          {hasErrors && (
            <IssueList title="Fix these problems before saving:" issues={state.errors ?? []} tone="danger" />
          )}
          {Boolean(state.warnings?.length) && (
            <IssueList title="Please review:" issues={state.warnings ?? []} tone="gold" />
          )}
          {!hasErrors && !state.warnings?.length && (
            <FormMessage message="The file has the expected structure." />
          )}

          {state.data && (
            <div className="rounded-[20px] border border-line bg-ink p-5 sm:p-6">
              <ScriptPreview data={state.data} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => send("save")} disabled={hasErrors} className="px-6">
              Save as version {nextVersion}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={reset} className="h-[52px]">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptUploader;
