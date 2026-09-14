import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "../../components/ui/Button.jsx";
import { PasswordField, TextField } from "../../components/ui/Field.jsx";
import { AuthAside } from "./AuthAside.jsx";
import { useRegisterMutation } from "../../hooks/queries.js";
import { describeError } from "../../components/ui/States.jsx";
import { toast } from "../../components/ui/Toast.jsx";

/*
  Mirrors the server's own rules exactly (middleware/validateRegistration.js):
  name, email and password all required, password at least 8 characters.
  The confirmation field is a client-side safeguard only.
*/
const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(80, "Name is too long"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Re-enter your password")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

/**
 * Registration page.
 *
 * Purpose : create a real account, then establish a real session.
 *           POST /api/auth/register returns 201 with the new user but NO
 *           token, so the mutation follows it with a real POST
 *           /api/auth/login. Both are live API calls.
 * Input   : name, email, password, confirmPassword.
 * Output  : an authenticated session redirected to /dashboard. If the account
 *           is created but the follow-up login fails, the user is sent to
 *           /login rather than being told registration failed.
 */
export default function Register() {
  const navigate = useNavigate();
  const signUp = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onSubmit"
  });

  useEffect(() => {
    document.title = "Create account — OctaTrade";
    setFocus("name");
  }, [setFocus]);

  async function onSubmit(values) {
    try {
      await signUp.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error?.accountCreated) {
        toast.info(
          "Account created",
          "Your account exists but the sign-in step did not complete. Please sign in."
        );
        navigate("/login", { replace: true });
      }
      /* Otherwise the error renders in the banner below. */
    }
  }

  const apiError =
    signUp.error && !signUp.error.accountCreated
      ? describeError(signUp.error, "your account")
      : null;

  const busy = isSubmitting || signUp.isPending;

  return (
    <div className="ot-auth">
      <main className="ot-auth__form-side" id="main">
        <div className="ot-auth__form-inner">
          <Link to="/" className="ot-auth__back">
            <ArrowLeft size={13} aria-hidden="true" />
            Back to OctaTrade
          </Link>

          <h1 className="ot-auth__title ot-display">Create your account</h1>
          <p className="ot-auth__lede">
            Your wallet opens with virtual funds in INR. No payment details, no
            capital at risk — every order is simulated against live quotes.
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
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />

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
              autoComplete="new-password"
              hint="At least 8 characters."
              error={errors.password?.message}
              {...register("password")}
            />

            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              size="lg"
              block
              loading={busy}
              className="ot-auth__submit"
              iconRight={!busy ? <ArrowRight size={15} aria-hidden="true" /> : null}
            >
              {busy ? "Creating account" : "Create account"}
            </Button>
          </form>

          <p className="ot-auth__alt">
            Already registered? <Link to="/login">Sign in</Link>.
          </p>
        </div>
      </main>

      <AuthAside variant="register" />
    </div>
  );
}
