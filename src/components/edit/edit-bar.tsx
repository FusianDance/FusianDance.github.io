import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, LogIn, LogOut, Pencil, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tip } from "@/components/edit/tip";
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

/** Floating edit controls, shown while logged in: Log out on the left, Discard / Edit-Preview / Save on the right. */
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
        <Tip label="Log out">
          <Button variant="outline" size="icon" onClick={onLogout} disabled={saving}>
            <LogOut />
          </Button>
        </Tip>
      ) : (
        <Tip label="Log in">
          <Button size="icon" onClick={login}>
            <LogIn />
          </Button>
        </Tip>
      )}
      <div className="flex max-w-xl flex-wrap items-center justify-end gap-3 rounded-lg border bg-background p-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground" aria-live="polite">
          {status}
        </p>
        {session ? (
          <div className="flex gap-2">
            <Tip label="Discard changes">
              <Button variant="outline" size="icon" onClick={cancel} disabled={!dirty || saving}>
                <Undo2 />
              </Button>
            </Tip>
            <ToggleGroup
              variant="outline"
              spacing={0}
              value={[session.preview ? "preview" : "edit"]}
              onValueChange={([mode]) => mode && setPreview(mode === "preview")}
            >
              <Tip label="Edit">
                <ToggleGroupItem value="edit">
                  <Pencil />
                </ToggleGroupItem>
              </Tip>
              <Tip label="Preview">
                <ToggleGroupItem value="preview">
                  <Eye />
                </ToggleGroupItem>
              </Tip>
            </ToggleGroup>
            <Tip label={saving ? "Saving…" : "Save"}>
              <Button size="icon" onClick={onSave} disabled={!token || !dirty || !!blocker || saving}>
                <Save />
              </Button>
            </Tip>
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
