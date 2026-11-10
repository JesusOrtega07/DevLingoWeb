"use client";

import { useActionState, useState } from "react";

import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { initialActionState } from "@/features/admin/action-state";
import { createInterview } from "@/features/admin/interview-actions";

type Props = { members: { id: string; displayName: string; interest: string | null }[] };

const CreateInterviewForm = ({ members }: Props) => {
  const [state, action, pending] = useActionState(createInterview, initialActionState);
  const [interest, setInterest] = useState("");

  if (members.length === 0) {
    return <p className="m-0 text-sm text-cream/66">Create a member account first.</p>;
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          id="memberId"
          name="memberId"
          label="Member"
          placeholder="Choose a member"
          defaultValue=""
          options={members.map((m) => ({ value: m.id, label: m.displayName }))}
          onChange={(e) => setInterest(members.find((m) => m.id === e.target.value)?.interest ?? "")}
          errors={state.fieldErrors?.memberId}
        />
        <TextField
          id="position"
          name="position"
          label="Position"
          placeholder="Junior Data Analyst"
          maxLength={120}
          errors={state.fieldErrors?.position}
        />
        <TextField
          id="interest"
          name="interest"
          label="Interest"
          placeholder="Data Science"
          maxLength={80}
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          errors={state.fieldErrors?.interest}
        />
      </div>
      <FormMessage error={state.error} />
      <div>
        <PrimaryButton type="submit" pending={pending} className="px-6">
          {pending ? "Creating…" : "Create interview"}
        </PrimaryButton>
      </div>
    </form>
  );
};

export default CreateInterviewForm;
