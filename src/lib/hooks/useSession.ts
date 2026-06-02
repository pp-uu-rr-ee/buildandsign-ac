"use client";

import { useEffect, useState } from "react";
import type { SessionPayload } from "@/lib/session";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: SessionPayload }
  | { status: "unauthenticated" };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setState({ status: "authenticated", user: data.user });
        } else {
          setState({ status: "unauthenticated" });
        }
      })
      .catch(() => setState({ status: "unauthenticated" }));
  }, []);

  return state;
}
