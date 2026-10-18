import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, LoaderCircle, LogIn, LogOut, Pencil, Save, TriangleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tip } from "@/components/edit/tip";
import {
  DEPLOY_DETAILS_URL,
  DEPLOY_TEXT,
  discard,
  finishLogin,
  isDirty,
  login,
  logout,
  problem,
  save,
  setPreview,
  startSession,
  useDeploy,
  useLoggedIn,
  useSession,
} from "@/lib/edit/session";
import { LOCAL, PAGES_SAVED_NOTE, TARGET_NOTE } from "@/lib/edit/target";

/** Floating edit controls, shown while logged in: Log out on the left, Discard / Edit-Preview / Save on the right. */
export function EditBar() {
  const loggedIn = useLoggedIn();
  const session = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [commit, setCommit] = useState<string | null>(null);
  const deploy = useDeploy(!!session && !LOCAL, commit);
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
    if (loggedIn && !session) startSession().catch((e: Error) => setMessage(e.message));
  }, [loggedIn, session]);

  if (!loggedIn && !session && !message) return null;

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
    discard();
  }

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      const { commit, pagesChanged } = await save();
      setCommit(commit);
      setMessage(pagesChanged ? `Saved. ${PAGES_SAVED_NOTE}` : "Saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  let status = message ?? blocker ?? (dirty ? "Unsaved changes" : "No changes yet");
  if (!session && !message) status = "Loading content…";
  if (!loggedIn && session) status = "Login expired. Your changes are kept, log in again to save them.";

  // Left: login state. Right: status and the draft's actions.
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex items-end justify-between gap-2 *:pointer-events-auto *:shadow-lg">
      {loggedIn ? (
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
        {TARGET_NOTE && <p className="basis-full text-sm font-medium text-primary">{TARGET_NOTE}</p>}
        {deploy && (
          <p className="flex basis-full items-center gap-2 text-sm" aria-live="polite">
            {deploy === "running" ? (
              <>
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
                {DEPLOY_TEXT.running}
              </>
            ) : (
              <>
                <TriangleAlert className="size-4 shrink-0 text-destructive" />
                <span>
                  {DEPLOY_TEXT.failed}{" "}
                  <a className="underline" href={DEPLOY_DETAILS_URL} target="_blank" rel="noreferrer">
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
              <Button size="icon" onClick={onSave} disabled={!loggedIn || !dirty || !!blocker || saving}>
                <Save />
              </Button>
            </Tip>
          </div>
        ) : (
          !loggedIn && (
            <Button variant="ghost" onClick={() => setMessage(null)}>
              Close
            </Button>
          )
        )}
      </div>
    </div>
  );
}
