"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { registerTeam, type RegisterFormState } from "./actions";
import { MembersInput } from "@/components/MembersInput";
import { TeamCard } from "@/components/TeamCard";
import { toast } from "@/components/Toaster";

const initial: RegisterFormState = { ok: false };

export function RegisterForm({
  editing,
}: {
  editing?: {
    id: string;
    name: string;
    members: string[];
    demo_url: string | null;
    tagline: string | null;
  };
}) {
  const [state, action] = useActionState(registerTeam, initial);

  useEffect(() => {
    if (state.ok && state.preview) {
      toast("success", `Saved "${state.preview.name}". Confirm below.`);
    } else if (state.error) {
      toast("error", state.error);
    }
  }, [state]);

  if (state.ok && state.preview) {
    return (
      <ConfirmationPreview
        preview={state.preview}
        retryHref={editing ? `/register?team=${state.preview.team_id}` : "/register"}
      />
    );
  }

  return (
    <form
      action={action}
      className="grid gap-6 max-w-2xl"
      noValidate
    >
      {editing?.id && (
        <input type="hidden" name="editing_id" value={editing.id} />
      )}

      <Field
        label="Team name"
        name="name"
        defaultValue={editing?.name}
        error={state.fieldErrors?.name}
        maxLength={60}
        required
      />

      <MembersInput
        name="members"
        initial={editing?.members ?? []}
        error={state.fieldErrors?.members}
      />

      <Field
        label="Demo URL (optional)"
        name="demo_url"
        type="url"
        placeholder="https://your-demo.example.com or https://gitlab.com/org/project"
        defaultValue={editing?.demo_url ?? ""}
        error={state.fieldErrors?.demo_url}
        help="A live web app URL or a GitLab repo. We'll try to auto-generate a thumbnail — leave blank if you don't have one yet."
      />

      <Field
        label="Tagline (optional)"
        name="tagline"
        defaultValue={editing?.tagline ?? ""}
        error={state.fieldErrors?.tagline}
        maxLength={120}
        help="One short sentence — what does the demo do?"
      />

      <SubmitButton editing={!!editing} />

      {state.error && (
        <p role="alert" className="text-warning text-[14px]">
          {state.error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  error,
  required,
  maxLength,
  help,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[14px] font-medium mb-2 text-text-on-dark">
        {label}
        {required && (
          <span className="text-liatrio-green ml-1" aria-hidden>
            *
          </span>
        )}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="input-dark"
        aria-invalid={!!error}
      />
      {help && !error && (
        <p className="mt-1.5 text-[12px] text-text-muted-dark">{help}</p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-warning">
          {error}
        </p>
      )}
    </label>
  );
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary self-start"
      disabled={pending}
    >
      {pending
        ? "Generating preview…"
        : editing
        ? "Save changes"
        : "Generate preview"}
    </button>
  );
}

function ConfirmationPreview({
  preview,
  retryHref,
}: {
  preview: NonNullable<RegisterFormState["preview"]>;
  retryHref: string;
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <span className="eyebrow-green">PREVIEW</span>
        <h2 className="h-section mt-2 text-text-on-dark">
          Here's what voters will see for{" "}
          <span className="h-emphasis">"{preview.name}".</span>
        </h2>
        <p className="text-text-muted-dark mt-2">
          Looks good? You're all set. Need to tweak it? Edit again while
          registration is open.
        </p>
      </div>

      <TeamCard
        team={{
          id: preview.team_id ?? "preview",
          name: preview.name,
          tagline: preview.tagline,
          members: preview.members,
          demo_url: preview.demo_url,
          thumbnail_url: preview.thumbnail_url,
          summary: preview.summary,
        }}
        variant="dark"
        showOpenLink
      />

      <div className="flex flex-wrap gap-3">
        <a className="btn btn-primary" href="/vote">
          Confirm and view gallery →
        </a>
        <a className="btn btn-secondary" href={retryHref}>
          Edit again
        </a>
      </div>
    </div>
  );
}
