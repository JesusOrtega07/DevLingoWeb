"use client";

import { useActionState, useState } from "react";

import CopyField from "@/components/ui/CopyField";
import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { initialActionState } from "@/features/admin/action-state";
import { ROLE_LABEL } from "@/features/admin/labels";
import { createUser } from "@/features/admin/user-actions";

const ROLE_OPTIONS = (["MEMBER", "EXPERT", "ADMIN"] as const).map((r) => ({ value: r, label: ROLE_LABEL[r] }));

const CreateUserForm = () => {
  const [state, action, pending] = useActionState(createUser, initialActionState);
  const [role, setRole] = useState("MEMBER");

  return (
    <div className="flex flex-col gap-5">
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
        <TextField id="name" name="name" label="Name" maxLength={80} errors={state.fieldErrors?.name} required />
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="off"
          errors={state.fieldErrors?.email}
          required
        />
        <SelectField
          id="role"
          name="role"
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          errors={state.fieldErrors?.role}
        />
        {role === "MEMBER" && (
          <>
            <TextField
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={99}
              label="Age (optional)"
              errors={state.fieldErrors?.age}
            />
            <TextField
              id="interest"
              name="interest"
              label="Interest (optional)"
              placeholder="Data Science"
              maxLength={80}
              errors={state.fieldErrors?.interest}
            />
          </>
        )}
        <div className="flex items-end sm:col-span-2">
          <PrimaryButton type="submit" pending={pending} className="w-full px-6 sm:w-auto">
            {pending ? "Creating…" : "Create account"}
          </PrimaryButton>
        </div>
      </form>

      <FormMessage error={state.error} message={state.message} />
      {state.link && <CopyField label="Invitation link" value={state.link} />}
    </div>
  );
};

export default CreateUserForm;
