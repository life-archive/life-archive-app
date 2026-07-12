"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";

export function RevealEmailLink({ encodedEmail }: { encodedEmail: number[] }) {
  const [revealed, setRevealed] = useState(false);
  const email = useMemo(
    () => String.fromCharCode(...encodedEmail.map((code) => code - 7)),
    [encodedEmail],
  );

  if (revealed) {
    return (
      <a
        className="flex cursor-pointer items-center gap-2 hover:text-ink"
        href={`mailto:${email}`}
      >
        <Mail aria-hidden="true" size={15} strokeWidth={1.8} />
        {email}
      </a>
    );
  }

  return (
    <button
      className="flex cursor-pointer items-center gap-2 text-left hover:text-ink"
      onClick={() => setRevealed(true)}
      type="button"
    >
      <Mail aria-hidden="true" size={15} strokeWidth={1.8} />
      Show email
    </button>
  );
}
