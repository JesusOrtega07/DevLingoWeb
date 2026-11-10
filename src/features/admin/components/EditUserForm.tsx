"use client";

import { useActionState } from "react";

import FormMessage from "@/components/ui/FormMessage";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextField from "@/components/ui/TextField";
import { initialActionState } from "@/features/admin/action-state";
import { updateUser } from "@/features/admin/user-actions";

type Props = {
  userId: string;
  name: string;
  isMember: boolean;
  age: number | null;
  interest: string | null;
};

const EditUserForm = ({ userId, name, isMember, age, interest }: Props) => {
  const [state, action, pending] = useActionState(updateUser, initialActionState);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="name" name="name" label="Name" defaultValue={name} maxLength={80} errors={state.fieldErrors?.name} />
        {isMember && (
          <>
            <TextField
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={99}
              label="Age"
              defaultValue={age ?? ""}
              errors={state.fieldErrors?.age}
            />
            <TextField
              id="interest"
              name="interest"
              label="Interest"
              defaultValue={interest ?? ""}
              maxLength={80}
              errors={state.fieldErrors?.interest}
            />
          </>
        )}
      </div>
      <FormMessage error={state.error} message={state.message} />
      <div>
        <PrimaryButton type="submit" pending={pending} className="px-6">
          {pending ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>
    </form>
  );
};

export default EditUserForm;
