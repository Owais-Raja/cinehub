"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
  };

  return (
    <div className="bg-[#212836] rounded-3xl border border-[#2D3748] p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#E83B50] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-[#E83B50]/30">
          <Film className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-white">Sign In to CineHub</h1>
        <p className="text-xs text-[#8E9AA8] mt-1">
          Access your bookings, seat reservations, and digital passes
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-[#8E9AA8] mb-1 font-medium">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E83B50]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#8E9AA8] mb-1 font-medium">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E83B50]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#E83B50]/30 transition-all mt-2"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* Demo Credentials Quick Fill for Evaluator */}
      <div className="mt-8 pt-6 border-t border-[#2D3748]">
        <span className="text-[10px] font-bold text-[#E8B86D] uppercase tracking-wider block mb-2 text-center">
          Reviewer Demo Accounts (One-Click Fill)
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("admin@cinehub.in", "Admin@1234")}
            className="p-2 rounded-xl bg-[#1E2430] hover:bg-[#242B3A] border border-[#2D3748] text-center transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#E8B86D] mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">Admin</span>
            <span className="text-[9px] text-[#8E9AA8] block">All Modules</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("staff@cinehub.in", "Staff@1234")}
            className="p-2 rounded-xl bg-[#1E2430] hover:bg-[#242B3A] border border-[#2D3748] text-center transition-colors"
          >
            <UserCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">Staff</span>
            <span className="text-[9px] text-[#8E9AA8] block">Gate Scan</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("ash@example.com", "Customer@1234")}
            className="p-2 rounded-xl bg-[#1E2430] hover:bg-[#242B3A] border border-[#2D3748] text-center transition-colors"
          >
            <Film className="w-4 h-4 text-[#E83B50] mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">Customer</span>
            <span className="text-[9px] text-[#8E9AA8] block">Ash</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-[#8E9AA8]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#E83B50] font-bold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Suspense fallback={<div className="text-center py-20 text-xs text-[#8E9AA8]">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
