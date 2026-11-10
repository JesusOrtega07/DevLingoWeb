"use client";

import { useActionState } from "react";

import CopyField from "@/components/ui/CopyField";
import FormMessage from "@/components/ui/FormMessage";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { initialActionState } from "@/features/admin/action-state";
import { generateInvite } from "@/features/admin/user-actions";

type Props = { userId: string; hasPassword: boolean; disabled: boolean };

const InviteLinkForm = ({ userId, hasPassword, disabled }: Props) => {
  const [state, action, pending] = useActionState(generateInvite, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <SecondaryButton type="submit" pending={pending} disabled={disabled}>
          {hasPassword ? "Create password reset link" : "Create new invitation link"}
        </SecondaryButton>
      </form>
      <FormMessage error={state.error} message={state.message} />
      {state.link && <CopyField label={hasPassword ? "Password reset link" : "Invitation link"} value={state.link} />}
    </div>
  );
};

export default InviteLinkForm;
