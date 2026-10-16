import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  finishLogin,
  isDirty,
  login,
  logout,
  problem,
  save,
  setPreview,
  startSession,
  updateDraft,
  useSession,
  useToken,
} from "@/lib/edit";

/** Floating edit controls, shown while logged in: Log out on the left, Cancel / Edit-Preview / Save on the right. */
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

  function onLogout() {
    if (dirty && !confirm("Log out and discard all unsaved changes?")) return;
    setMessage(null);
    logout();
  }

  function cancel() {
    if (!confirm("Discard all unsaved changes?")) return;
    setMessage(null);
    updateDraft(() => session!.base);
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

  let status = message ?? blocker ?? (dirty ? "Unsaved changes" : "No changes yet");
  if (!session && !message) status = "Loading content…";
  if (!token && session) status = "Login expired. Your changes are kept, log in again to save them.";

  // Left: login state. Right: status and the draft's actions.
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex items-end justify-between gap-2 *:pointer-events-auto *:shadow-lg">
      {token ? (
        <Button variant="outline" onClick={onLogout} disabled={saving}>
          Log out
        </Button>
      ) : (
        <Button onClick={login}>Log in</Button>
      )}
      <div className="flex max-w-xl flex-wrap items-center justify-end gap-3 rounded-lg border bg-background p-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground" aria-live="polite">
          {status}
        </p>
        {session ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel} disabled={!dirty || saving}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => setPreview(!session.preview)}>
              {session.preview ? <Pencil /> : <Eye />}
              {session.preview ? "Edit" : "Preview"}
            </Button>
            <Button onClick={onSave} disabled={!token || !dirty || !!blocker || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          !token && (
            <Button variant="ghost" onClick={() => setMessage(null)}>
              Close
            </Button>
          )
        )}
      </div>
    </div>
  );
}
