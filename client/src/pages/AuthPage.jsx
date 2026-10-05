import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Use at least 6 characters")
});
function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAppStore((state) => state.setAuth);
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });
  const authMutation = useMutation({
    mutationFn: async (values) => {
      if (mode === "register") {
        if (!values.name?.trim()) {
          throw new Error("Enter your name");
        }
        await api.register(values.name.trim(), values.email, values.password);
      }
      return api.login(values.email, values.password);
    },
    onSuccess: (result) => {
      setAuth(result.token, result.user);
      toast.success(mode === "register" ? "Your paper account is ready" : "Welcome back");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to continue");
    }
  });
  return <div className="auth-video-page relative min-h-screen overflow-hidden bg-black text-white">
      <video className="auth-video-background" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/videos/bullish-ascent.mp4" type="video/mp4" />
      </video>
      <div className="auth-video-overlay pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" aria-label="Return to OctaTrade home"><Brand /></Link>
        <div className="hidden items-center gap-2 text-xs text-white/45 sm:flex">
          <ShieldCheck className="size-4 text-brand-400" />
          Secure paper-trading workspace
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-5 py-10 md:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-16">
        <motion.section
    initial={{ opacity: 0, x: -24 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.55 }}
    className="hidden lg:block"
  >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/8 px-3 py-1.5 text-[11px] font-semibold text-brand-300">
            <Sparkles className="size-3.5" />
            Market intelligence, without the noise
          </div>
          <h1 className="max-w-2xl text-5xl leading-[1.04] font-semibold tracking-[-0.055em] xl:text-6xl">
            Build conviction.
            <span className="block bg-gradient-to-r from-brand-200 via-brand-500 to-brand-700 bg-clip-text text-transparent">
              Trade with clarity.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/48">
            A high-fidelity paper trading environment for testing ideas, tracking performance and learning the rhythm of markets.
          </p>

          <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
            {[
    ["INR", "Virtual wallet"],
    ["Live", "Market quotes"],
    ["Zero", "Financial risk"]
  ].map(([value, label], index) => <motion.div
    key={label}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 + index * 0.1 }}
    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur"
  >
                <p className="text-xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[10px] font-medium tracking-wide text-white/35 uppercase">{label}</p>
              </motion.div>)}
          </div>

        </motion.section>

        <motion.section
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: 0.08 }}
    className="mx-auto w-full max-w-md"
  >
          <div className="rounded-[28px] border border-white/12 bg-black/25 p-2 shadow-[0_30px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl">
            <div className="rounded-[22px] border border-white/8 bg-black/75 p-6 sm:p-8">
              <div className="mb-7 lg:hidden">
                <p className="text-xs font-semibold text-brand-400">Welcome to OctaTrade</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Markets, clearly.</h1>
              </div>

              <div className="flex rounded-xl bg-white/5 p-1">
                {["login", "register"].map((value) => <button
    type="button"
    key={value}
    onClick={() => setMode(value)}
    className="relative h-10 flex-1 text-xs font-semibold capitalize"
  >
                    {mode === value ? <motion.span layoutId="auth-mode" className="absolute inset-0 rounded-lg bg-white/8 shadow-sm" /> : null}
                    <span className={mode === value ? "relative text-white" : "relative text-white/38"}>
                      {value === "login" ? "Sign in" : "Create account"}
                    </span>
                  </button>)}
              </div>

              <div className="mt-7">
                <h2 className="text-xl font-semibold tracking-tight">
                  {mode === "login" ? "Welcome back" : "Start your paper portfolio"}
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-white/40">
                  {mode === "login" ? "Enter your details to return to the market." : "Learn, experiment and improve without financial risk."}
                </p>
              </div>

              <form onSubmit={form.handleSubmit((values) => authMutation.mutate(values))} className="mt-6 space-y-4">
                {mode === "register" ? <div>
                    <label htmlFor="name" className="mb-2 block text-[11px] font-semibold text-white/55">Full name</label>
                    <Input id="name" placeholder="Vishwaranjan Singh" className="border-white/8 bg-white/5 text-white placeholder:text-white/25" {...form.register("name")} />
                  </div> : null}

                <div>
                  <label htmlFor="email" className="mb-2 block text-[11px] font-semibold text-white/55">Email address</label>
                  <Input id="email" type="email" placeholder="you@example.com" className="border-white/8 bg-white/5 text-white placeholder:text-white/25" {...form.register("email")} />
                  {form.formState.errors.email ? <p className="mt-1.5 text-[11px] text-red-400">{form.formState.errors.email.message}</p> : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-[11px] font-semibold text-white/55">Password</label>
                    {mode === "login" ? <button type="button" className="text-[10px] font-semibold text-brand-400">Forgot password?</button> : null}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="border-white/8 bg-white/5 pr-11 text-white placeholder:text-white/25" {...form.register("password")} />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/35 hover:text-white" aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password ? <p className="mt-1.5 text-[11px] text-red-400">{form.formState.errors.password.message}</p> : null}
                </div>

                <Button type="submit" size="lg" loading={authMutation.isPending} className="mt-2 w-full">
                  {mode === "login" ? "Enter workspace" : "Create paper account"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <p className="mt-6 text-center text-[10px] leading-4 text-white/25">
                Paper trades only. OctaTrade does not provide investment advice.
              </p>
            </div>
          </div>
        </motion.section>
      </main>
    </div>;
}
export {
  AuthPage
};
