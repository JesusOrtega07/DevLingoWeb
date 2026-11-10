"use client";

import { useActionState } from "react";

import FormMessage from "@/components/ui/FormMessage";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { initialActionState } from "@/features/admin/action-state";
import { setUserActive } from "@/features/admin/user-actions";

type Props = { userId: string; isActive: boolean; isSelf: boolean };

const ActiveToggleForm = ({ userId, isActive, isSelf }: Props) => {
  const [state, action, pending] = useActionState(setUserActive, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <form
        action={action}
        onSubmit={(e) => {
          if (isActive && !window.confirm("Deactivate this account? The person will be signed out.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="active" value={isActive ? "false" : "true"} />
        <SecondaryButton type="submit" tone={isActive ? "danger" : "default"} pending={pending} disabled={isSelf}>
          {isActive ? "Deactivate account" : "Activate account"}
        </SecondaryButton>
      </form>
      {isSelf && <p className="m-0 text-[13px] text-cream/60">You can&apos;t deactivate your own account.</p>}
      <FormMessage error={state.error} message={state.message} />
    </div>
  );
};

export default ActiveToggleForm;
