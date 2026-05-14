"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { registerTeam, type RegisterFormState } from "./actions";
import { MembersInput } from "@/components/MembersInput";
import { TeamCard } from "@/components/TeamCard";
import { toast } from "@/components/Toaster";
import { getBrowserSupabase } from "@/lib/supabase/client";

const initial: RegisterFormState = { ok: false };

const SUMMARY_MAX = 500;
const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
const ACCEPTED_THUMBNAIL_TYPES = ["image/png", "image/jpeg", "image/webp"];
const THUMBNAIL_BUCKET = "team-thumbnails";

export function RegisterForm({
  editing,
}: {
  editing?: {
    id: string;
    name: string;
    members: string[];
    demo_url: string | null;
    tagline: string | null;
    summary: string | null;
    running_locally: boolean;
    thumbnail_url: string | null;
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
    <FormBody
      key={editing?.id ?? "new"}
      editing={editing}
      action={action}
      state={state}
    />
  );
}

function FormBody({
  editing,
  action,
  state,
}: {
  editing?: {
    id: string;
    name: string;
    members: string[];
    demo_url: string | null;
    tagline: string | null;
    summary: string | null;
    running_locally: boolean;
    thumbnail_url: string | null;
  };
  action: (formData: FormData) => void;
  state: RegisterFormState;
}) {
  const [demoUrl, setDemoUrl] = useState(editing?.demo_url ?? "");
  const [runningLocally, setRunningLocally] = useState(
    editing?.running_locally ?? false,
  );
  const [summary, setSummary] = useState(editing?.summary ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    editing?.thumbnail_url ?? null,
  );
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<
    string | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs we create for live previews so blobs are GC'd.
  useEffect(() => {
    return () => {
      if (
        thumbnailPreview &&
        thumbnailPreview.startsWith("blob:") &&
        typeof URL !== "undefined"
      ) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  function onDemoUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDemoUrl(v);
    // UX nudge: filling a URL clears the in-person checkbox. The server still
    // accepts either / neither — these two fields are mutually exclusive only
    // visually.
    if (v.trim().length > 0 && runningLocally) {
      setRunningLocally(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setThumbnailError(null);
    setUploadedThumbnailUrl(null);

    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview(editing?.thumbnail_url ?? null);
      return;
    }

    if (!ACCEPTED_THUMBNAIL_TYPES.includes(file.type)) {
      setThumbnailError("Use PNG, JPEG, or WebP.");
      setThumbnailFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > THUMBNAIL_MAX_BYTES) {
      setThumbnailError("Image must be 2 MiB or smaller.");
      setThumbnailFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setThumbnailFile(file);
    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);

    setUploading(true);
    try {
      const supabase = getBrowserSupabase();
      const ext =
        file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        (file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
          ? "webp"
          : "jpg");
      const slug = (editing?.id ?? "new")
        .toString()
        .replace(/[^a-z0-9-]/gi, "-")
        .toLowerCase();
      const key = `${slug}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(THUMBNAIL_BUCKET)
        .upload(key, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "3600",
        });
      if (uploadError) {
        setThumbnailError(
          uploadError.message.toLowerCase().includes("bucket")
            ? "Storage bucket not provisioned — ask the admin to run the 0003 migration."
            : `Upload failed: ${uploadError.message}`,
        );
        return;
      }
      const { data: pub } = supabase.storage
        .from(THUMBNAIL_BUCKET)
        .getPublicUrl(key);
      setUploadedThumbnailUrl(pub.publicUrl);
    } catch {
      setThumbnailError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearThumbnail() {
    setThumbnailFile(null);
    setUploadedThumbnailUrl(null);
    setThumbnailError(null);
    setThumbnailPreview(editing?.thumbnail_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const summaryRemaining = SUMMARY_MAX - summary.length;
  const summaryOver = summaryRemaining < 0;
  const summaryNearLimit = summaryRemaining <= 40;

  return (
    <form action={action} className="grid gap-6 max-w-2xl" noValidate>
      {editing?.id && (
        <input type="hidden" name="editing_id" value={editing.id} />
      )}
      {/* Hidden URL surfaced to the server action when a thumbnail upload
          completed. The server validates it's from the team-thumbnails
          bucket before persisting. */}
      <input
        type="hidden"
        name="thumbnail_upload_url"
        value={uploadedThumbnailUrl ?? ""}
      />

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

      <DemoLocationField
        demoUrl={demoUrl}
        onDemoUrlChange={onDemoUrlChange}
        runningLocally={runningLocally}
        onRunningLocallyChange={setRunningLocally}
        error={state.fieldErrors?.demo_url}
      />

      <SummaryField
        value={summary}
        onChange={setSummary}
        remaining={summaryRemaining}
        over={summaryOver}
        nearLimit={summaryNearLimit}
        error={state.fieldErrors?.summary}
      />

      <ThumbnailField
        previewUrl={thumbnailPreview}
        onChange={onFileChange}
        onClear={clearThumbnail}
        uploading={uploading}
        uploaded={!!uploadedThumbnailUrl}
        error={thumbnailError ?? state.fieldErrors?.thumbnail_url}
        inputRef={fileInputRef}
        hasFile={!!thumbnailFile}
      />

      <SubmitButton editing={!!editing} blocked={uploading || summaryOver} />

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

function DemoLocationField({
  demoUrl,
  onDemoUrlChange,
  runningLocally,
  onRunningLocallyChange,
  error,
}: {
  demoUrl: string;
  onDemoUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  runningLocally: boolean;
  onRunningLocallyChange: (next: boolean) => void;
  error?: string;
}) {
  const checkboxId = useId();
  const inputId = useId();
  const helperId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="block">
        <span className="block text-[14px] font-medium mb-2 text-text-on-dark">
          Demo URL (optional)
        </span>
      </label>
      <input
        id={inputId}
        type="url"
        name="demo_url"
        value={demoUrl}
        onChange={onDemoUrlChange}
        placeholder="https://your-demo.example.com or https://gitlab.com/org/project"
        disabled={runningLocally}
        className={clsx(
          "input-dark",
          runningLocally && "opacity-60 cursor-not-allowed",
        )}
        aria-describedby={helperId}
        aria-invalid={!!error}
      />
      <div className="mt-2.5 flex items-start gap-2.5">
        <input
          id={checkboxId}
          type="checkbox"
          name="running_locally"
          checked={runningLocally}
          onChange={(e) => onRunningLocallyChange(e.target.checked)}
          className="mt-[3px] h-4 w-4 rounded border border-border-dark bg-surface-dark accent-liatrio-green cursor-pointer"
        />
        <label
          htmlFor={checkboxId}
          className="text-[14px] text-text-on-dark cursor-pointer leading-snug"
        >
          Demo is running locally
          <span className="block text-[12px] text-text-muted-dark mt-0.5">
            Pick this if you'll show the build live at the event instead of
            sharing a URL.
          </span>
        </label>
      </div>
      <p id={helperId} className="mt-2 text-[12px] text-text-muted-dark">
        {runningLocally
          ? "Not needed — demo will be shown in person."
          : "A live web app URL or a GitLab repo. We'll try to auto-generate a thumbnail. Leave blank if there's nothing to link yet."}
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryField({
  value,
  onChange,
  remaining,
  over,
  nearLimit,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  remaining: number;
  over: boolean;
  nearLimit: boolean;
  error?: string;
}) {
  const id = useId();
  const helpId = useId();
  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="block text-[14px] font-medium mb-2 text-text-on-dark">
          Demo Summary
          <span className="text-liatrio-green ml-1" aria-hidden>
            *
          </span>
        </span>
      </label>
      <textarea
        id={id}
        name="summary"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={SUMMARY_MAX + 50 /* hard cap above soft limit so paste-overs are still visible briefly */}
        className="input-dark resize-y min-h-[120px]"
        placeholder="What did you build? Who's it for? What problem does it solve?"
        aria-describedby={helpId}
        aria-invalid={!!error || over}
        required
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p id={helpId} className="text-[12px] text-text-muted-dark">
          What did you build? What problem does it solve? 1–3 sentences.
        </p>
        <p
          aria-live="polite"
          className={clsx(
            "text-[12px] tabular-nums",
            over
              ? "text-warning font-semibold"
              : nearLimit
              ? "text-text-on-dark"
              : "text-text-muted-dark",
          )}
        >
          {value.length}/{SUMMARY_MAX}
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

function ThumbnailField({
  previewUrl,
  onChange,
  onClear,
  uploading,
  uploaded,
  error,
  inputRef,
  hasFile,
}: {
  previewUrl: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement>;
  hasFile: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="block text-[14px] font-medium mb-2 text-text-on-dark">
          Custom thumbnail (optional)
        </span>
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-48 aspect-[16/9] rounded-lg overflow-hidden border border-border-dark bg-[#1a2128] shrink-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: + 3rd-party preview, intentional
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-eyebrow text-text-muted-dark">
              No thumbnail
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPTED_THUMBNAIL_TYPES.join(",")}
            onChange={onChange}
            className="block w-full text-[13px] text-text-muted-dark file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-[13px] file:font-semibold file:bg-surface-dark file:text-text-on-dark file:cursor-pointer hover:file:bg-[#1a2128]"
            aria-invalid={!!error}
          />
          <p className="mt-2 text-[12px] text-text-muted-dark leading-[1.5]">
            PNG / JPEG / WebP, max 2 MiB. Skip this and we'll try to grab a
            screenshot from your demo URL.
          </p>
          <div className="mt-2 flex items-center gap-3 min-h-[20px]">
            {uploading && (
              <span className="text-[12px] text-text-muted-dark">
                Uploading…
              </span>
            )}
            {!uploading && uploaded && (
              <span className="text-[12px] text-liatrio-green">
                ✓ Uploaded
              </span>
            )}
            {hasFile && !uploading && (
              <button
                type="button"
                onClick={onClear}
                className="text-[12px] text-text-muted-dark hover:text-text-on-dark underline underline-offset-2"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton({
  editing,
  blocked,
}: {
  editing: boolean;
  blocked: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || blocked;
  return (
    <button
      type="submit"
      className="btn btn-primary self-start"
      disabled={disabled}
      aria-disabled={disabled}
    >
      {pending
        ? "Submitting…"
        : editing
        ? "Save changes"
        : "Submit Demo"}
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
          running_locally: preview.running_locally,
        }}
        variant="dark"
        showOpenLink
      />

      <div className="flex flex-wrap gap-3">
        <a className="btn btn-primary" href="/vote">
          Confirm and view demos →
        </a>
        <a className="btn btn-secondary" href={retryHref}>
          Edit again
        </a>
      </div>
    </div>
  );
}
