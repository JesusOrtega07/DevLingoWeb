"use client";

import { useActionState } from "react";

import PrimaryButton from "@/components/ui/PrimaryButton";
import TextField from "@/components/ui/TextField";
import { type FormState, acceptInvitation } from "@/features/auth/actions";
import { PASSWORD_MIN } from "@/features/auth/schemas";

type Props = {
  token: string;
  name: string;
  email: string;
};

const initialState: FormState = {};

const InviteForm = ({ token, name, email }: Props) => {
  const [state, action, pending] = useActionState(acceptInvitation, initialState);

  return (
    <form
      action={action}
      noValidate
      className="box-border flex w-full flex-col gap-6 rounded-[20px] border border-line bg-surface p-10"
    >
      <input type="hidden" name="token" value={token} />
      {/* Ayuda a los gestores de contraseñas a asociar la contraseña con el email. */}
      <input type="hidden" name="username" autoComplete="username" value={email} readOnly />

      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Welcome, {name}</h1>
        <p className="m-0 text-[15px] leading-normal text-cream/66">
          Create a password to activate your account ({email}).
        </p>
      </div>

      {state.error && (
        <p role="alert" className="m-0 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <TextField
        id="password"
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        maxLength={128}
        errors={state.fieldErrors?.password}
        aria-describedby="password-hint"
        required
      />
      <p id="password-hint" className="-mt-4 mb-0 text-[13px] text-cream/60">
        At least {PASSWORD_MIN} characters. A short sentence works well.
      </p>
      <TextField
        id="confirm"
        name="confirm"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirm}
        required
      />

      <PrimaryButton type="submit" pending={pending}>
        {pending ? "Saving…" : "Activate account"}
      </PrimaryButton>
    </form>
  );
};

export default InviteForm;
