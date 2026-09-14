import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "../../components/ui/Button.jsx";
import { PasswordField, TextField } from "../../components/ui/Field.jsx";
import { AuthAside } from "./AuthAside.jsx";
import { useLoginMutation } from "../../hooks/queries.js";
import { describeError } from "../../components/ui/States.jsx";

/*
  Validation mirrors what the API will actually reject, and nothing more.
  POST /api/auth/login compares a bcrypt hash, so any non-empty password is a
  legitimate attempt — imposing the registration length rule here would block
  valid sign-ins to older accounts.
*/
const schema = z.object({
  email: z.email("Enter the email address you registered with"),
  password: z.string().min(1, "Enter your password")
});

/**
 * Login page.
 *
 * Purpose : authenticate against the real API, store the bearer token and land
 *           the user on /dashboard (or the page they were trying to reach).
 * Input   : email + password from the form.
 * Output  : a session, or a rendered API-error state. Nothing is simulated and
 *           there is no demo account.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLoginMutation();

  const from = location.state?.from;

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit"
  });

  useEffect(() => {
    document.title = "Sign in — OctaTrade";
    setFocus("email");
  }, [setFocus]);

  /**
   * Submits credentials.
   * Input  : { email, password } already validated by zod.
   * Output : navigates to the protected destination on success. Failures stay
   *          on the page and surface the API's message.
   */
  async function onSubmit(values) {
    try {
      await login.mutateAsync(values);
      navigate(from && from !== "/login" ? from : "/dashboard", { replace: true });
    } catch {
      /* Error is rendered from the mutation state below. */
    }
  }

  const apiError = login.error ? describeError(login.error, "your session") : null;
  const busy = isSubmitting || login.isPending;

  return (
    <div className="ot-auth">
      <main className="ot-auth__form-side" id="main">
        <div className="ot-auth__form-inner">
          <Link to="/" className="ot-auth__back">
            <ArrowLeft size={13} aria-hidden="true" />
            Back to OctaTrade
          </Link>

          <h1 className="ot-auth__title ot-display">Sign in</h1>
          <p className="ot-auth__lede">
            Access your paper-trading workspace. Sessions are protected with a
            bearer token issued by the OctaTrade API.
          </p>

          {apiError ? (
            <div className="ot-auth__error" role="alert" style={{ marginBottom: 22 }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>
                <strong style={{ fontWeight: 560 }}>{apiError.title}.</strong>{" "}
                {apiError.description}
              </span>
            </div>
          ) : null}

          <form className="ot-auth__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck="false"
              error={errors.email?.message}
              {...register("email")}
            />

            <PasswordField
              label="Password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              size="lg"
              block
              loading={busy}
              className="ot-auth__submit"
              iconRight={!busy ? <ArrowRight size={15} aria-hidden="true" /> : null}
            >
              {busy ? "Signing in" : "Sign in"}
            </Button>
          </form>

          <p className="ot-auth__alt">
            No account yet? <Link to="/register">Create one</Link> — it takes a
            name, an email and a password.
          </p>
        </div>
      </main>

      <AuthAside variant="login" />
    </div>
  );
}
