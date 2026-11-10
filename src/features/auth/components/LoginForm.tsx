"use client";

import { useActionState } from "react";

import PrimaryButton from "@/components/ui/PrimaryButton";
import TextField from "@/components/ui/TextField";
import { type FormState, login } from "@/features/auth/actions";

const initialState: FormState = {};

const LoginForm = () => {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form
      action={action}
      noValidate
      className="box-border flex w-full flex-col gap-6 rounded-[20px] border border-line bg-surface p-10"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] leading-[1.25] font-bold">Welcome back</h1>
        <p className="m-0 text-[15px] leading-normal text-cream/66">Sign in to continue to DevLingo Community.</p>
      </div>

      {state.error && (
        <p role="alert" className="m-0 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        placeholder="lili@devlingo.community"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        required
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
        required
      />

      <PrimaryButton type="submit" pending={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </PrimaryButton>
    </form>
  );
};

export default LoginForm;
