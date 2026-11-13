"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Film, Lock, Mail, User, Phone, AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone: phone ? `+91${phone.replace(/[^0-9]/g, "").slice(-10)}` : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      // Automatically sign in the registered user
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-[#212836] rounded-3xl border border-[#2D3748] p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E83B50] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-[#E83B50]/30">
            <Film className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">Create Account</h1>
          <p className="text-xs text-[#8E9AA8] mt-1">
            Join CineHub for seamless cinema ticketing across India
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#8E9AA8] mb-1 font-medium">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E83B50]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#8E9AA8] mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@example.com"
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E83B50]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#8E9AA8] mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 chars with uppercase and number"
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E83B50]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#8E9AA8] mb-1 font-medium">Mobile Number (India +91)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8E9AA8] font-bold text-[11px]">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className="w-full bg-[#1E2430] border border-[#2D3748] rounded-xl pl-12 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E83B50]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#E83B50] hover:bg-[#D32F43] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#E83B50]/30 transition-all mt-3"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8E9AA8]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E83B50] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

