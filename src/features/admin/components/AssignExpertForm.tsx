"use client";

import { useActionState } from "react";

import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SelectField from "@/components/ui/SelectField";
import { initialActionState } from "@/features/admin/action-state";
import { assignExpert } from "@/features/admin/interview-actions";

type Props = {
  interviewId: string;
  currentExpertId: string | null;
  experts: { id: string; name: string }[];
};

const AssignExpertForm = ({ interviewId, currentExpertId, experts }: Props) => {
  const [state, action, pending] = useActionState(assignExpert, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="interviewId" value={interviewId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SelectField
            id="expertId"
            name="expertId"
            label="English Expert"
            placeholder="Nobody (unassigned)"
            defaultValue={currentExpertId ?? ""}
            options={experts.map((e) => ({ value: e.id, label: e.name }))}
            errors={state.fieldErrors?.expertId}
          />
        </div>
        <PrimaryButton type="submit" pending={pending} className="px-6">
          {pending ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
      <FormMessage error={state.error} message={state.message} />
    </form>
  );
};

export default AssignExpertForm;
