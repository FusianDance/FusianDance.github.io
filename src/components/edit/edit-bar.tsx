import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, LoaderCircle, LogIn, LogOut, Pencil, Save, TriangleAlert, Undo2 } from "lucide-react";
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
  useDeploy,
  useSession,
  useToken,
} from "@/lib/edit";

/** Floating edit controls, shown while logged in: Log out on the left, Discard / Edit-Preview / Save on the right. */
export function EditBar() {
  const token = useToken();
  const session = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [commit, setCommit] = useState<string | null>(null);
  const deploy = useDeploy(!!session, commit);
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
      setCommit(await save(token!, session!));
      setMessage("Saved.");
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
        {deploy && (
          <p className="flex basis-full items-center gap-2 text-sm" aria-live="polite">
            {deploy === "running" ? (
              <>
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
                Updating the site (about 2 minutes). Until then it shows the old content.
              </>
            ) : (
              <>
                <TriangleAlert className="size-4 shrink-0 text-destructive" />
                <span>
                  The last site update failed, so it shows old content.{" "}
                  <a
                    className="underline"
                    href="https://github.com/FusianDance/FusianDance.github.io/actions/workflows/deploy.yml"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Details
                  </a>
                </span>
              </>
            )}
          </p>
        )}
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
