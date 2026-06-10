import { allowedDomain, authMode } from "@/app/lib/sessio-auth";
import PasswordLoginForm from "./PasswordLoginForm";
import EmailLoginForm from "./EmailLoginForm";

export default function LoginPage() {
  const mode = authMode();
  return (
    <div className="board-bg flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface/60 p-7">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-tight">Sessio</span>
          <span className="h-4 w-px bg-border" />
          <span className="text-lg font-semibold tracking-tight text-muted-strong">
            Roadmap
          </span>
        </div>
        {mode === "sessio" ? (
          <EmailLoginForm domain={allowedDomain()} />
        ) : (
          <PasswordLoginForm />
        )}
      </div>
    </div>
  );
}
