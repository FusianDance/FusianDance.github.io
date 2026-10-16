import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  exitEditMode,
  finishLogin,
  isDirty,
  login,
  problem,
  save,
  startSession,
  useSession,
  useToken,
} from "@/lib/edit";

/** Floating Cancel/Save bar, shown while in edit mode. */
export function EditBar() {
  const token = useToken();
  const session = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const login = finishLogin();
    if (!login) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- once on mount, the URL is only readable on the client
    setMessage("Logging in…");
    login.then(
      (path) => {
        setMessage(null);
        navigate(path);
      },
      (e: Error) => setMessage(e.message),
    );
  }, [navigate]);

  useEffect(() => {
    if (token && !session) startSession(token).catch((e: Error) => setMessage(e.message));
  }, [token, session]);

  if (!token && !session && !message) return null;

  const dirty = !!session && isDirty(session);
  const blocker = session && problem(session.draft);

  function cancel() {
    if (dirty && !confirm("Discard all unsaved changes?")) return;
    setMessage(null);
    exitEditMode();
  }

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      await save(token!, session!);
      setMessage("Saved. The site updates in about 2 minutes.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  let status = message ?? blocker ?? (dirty ? "Unsaved changes" : "Edit mode: no changes yet");
  if (!session && !message) status = "Loading content…";
  if (!token && session) status = "Login expired. Your changes are kept, log in again to save them.";

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3 shadow-lg sm:left-auto sm:max-w-xl">
      {token && session && (
        <nav className="flex gap-3 text-sm font-medium">
          <Link to="/events" className="underline-offset-4 hover:underline">
            Events
          </Link>
          <Link to="/gallery" className="underline-offset-4 hover:underline">
            Gallery
          </Link>
          <Link to="/about" className="underline-offset-4 hover:underline">
            About
          </Link>
          <Link to="/edit/contact" className="underline-offset-4 hover:underline">
            Contact
          </Link>
        </nav>
      )}
      <p className="min-w-0 flex-1 text-sm text-muted-foreground" aria-live="polite">
        {status}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={cancel} disabled={saving}>
          {dirty ? "Cancel" : "Exit"}
        </Button>
        {token ? (
          <Button onClick={onSave} disabled={!dirty || !!blocker || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        ) : (
          <Button onClick={login}>Log in</Button>
        )}
      </div>
    </div>
  );
}
