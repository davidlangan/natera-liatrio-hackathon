"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AdminLoginState } from "./actions";

const initial: AdminLoginState = { error: "" };

export function AdminLogin() {
  const [state, action] = useActionState(loginAction, initial);
  return (
    <form
      action={action}
      className="card-light p-8 max-w-md mx-auto space-y-5"
    >
      <div>
        <span className="eyebrow">ADMIN</span>
        <h2 className="h-section text-[24px] mt-2">
          Enter the <span className="h-emphasis">shared passcode.</span>
        </h2>
        <p className="mt-2 text-text-muted-light text-[14px]">
          Set via the <code className="font-mono">ADMIN_PASSCODE</code> env var.
        </p>
      </div>
      <label className="block">
        <span className="block text-[14px] font-medium mb-2 text-text-on-light">
          Passcode
        </span>
        <input
          type="password"
          name="passcode"
          autoFocus
          className="input"
          autoComplete="current-password"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-warning text-[13px]">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Checking…" : "Unlock admin"}
    </button>
  );
}
