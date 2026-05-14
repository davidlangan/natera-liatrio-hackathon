"use client";

import { useState, KeyboardEvent } from "react";

export function MembersInput({
  name,
  initial = [],
  max = 10,
  error,
}: {
  name: string;
  initial?: string[];
  max?: number;
  error?: string;
}) {
  const [members, setMembers] = useState<string[]>(initial);
  const [value, setValue] = useState("");

  function addCurrent() {
    const v = value.trim();
    if (!v) return;
    if (members.length >= max) return;
    if (members.includes(v)) {
      setValue("");
      return;
    }
    setMembers((m) => [...m, v]);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCurrent();
    } else if (e.key === "Backspace" && value === "" && members.length > 0) {
      setMembers((m) => m.slice(0, -1));
    }
  }

  return (
    <div>
      <label className="block text-[14px] font-medium mb-2 text-text-on-dark">
        Team members{" "}
        <span className="text-text-muted-dark">
          ({members.length}/{max})
        </span>
      </label>
      <div className="flex flex-wrap gap-2 mb-2" aria-label="Current members">
        {members.map((m) => (
          <span key={m} className="chip chip-dark">
            {m}
            <button
              type="button"
              aria-label={`Remove ${m}`}
              className="ml-1 text-text-muted-dark hover:text-text-on-dark"
              onClick={() =>
                setMembers((arr) => arr.filter((x) => x !== m))
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="input-dark"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addCurrent}
        placeholder="Type a name and press Enter"
        aria-describedby="members-help"
        disabled={members.length >= max}
      />
      <p
        id="members-help"
        className="mt-1.5 text-[12px] text-text-muted-dark"
      >
        Use comma or Enter to add. Backspace removes the last chip.
      </p>
      {/* Hidden value used by the form action */}
      <input type="hidden" name={name} value={members.join(",")} />
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-warning">
          {error}
        </p>
      )}
    </div>
  );
}
