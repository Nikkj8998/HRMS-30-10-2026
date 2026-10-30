import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { Redirect } from "wouter";
import { useState } from "react";
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { organizationName } = useOrganization();
  const base = (import.meta.env.BASE_URL ?? "/");
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#030816] overflow-hidden flex flex-col lg:flex-row font-sans selection:bg-blue-600/30 selection:text-white">
      {/* Self-contained styling block for premium 2026 visionOS keyframes & micro-interactions */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }

        @keyframes subtle-ribbon-drift {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(15px, -10px) rotate(0.2deg) scale(1.01); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes radial-pulse {
          0%, 100% { transform: scale(1); opacity: 0.05; }
          50% { transform: scale(1.05); opacity: 0.12; }
        }
        @keyframes sweep-shine {
          0% { left: -100%; }
          50%, 100% { left: 200%; }
        }
        @keyframes glass-shimmer {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.06; }
        }
        @keyframes focus-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
          50% { box-shadow: 0 0 0 4px rgba(59,130,246,0.06); }
        }
        @keyframes btn-spring {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
        .anim-ribbon { animation: subtle-ribbon-drift 28s infinite ease-in-out; }
        .anim-pulse-glow { animation: radial-pulse 14s infinite ease-in-out; }
        .glow-button {
          background-size: 200% 200%;
          animation: gradient-shift 5s infinite ease-in-out;
        }
        .glow-button:hover { animation: gradient-shift 3s infinite ease-in-out, btn-spring 0.4s ease-out; }
        .shimmer-sweep::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-25deg);
          animation: sweep-shine 6s infinite ease-in-out;
        }
        .glass-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
          border-radius: 28px 28px 0 0;
          pointer-events: none;
          z-index: 10;
        }
        .glass-card::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 27px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, transparent 60%, rgba(124, 58, 237, 0.02) 100%);
          pointer-events: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: glass-shimmer 8s infinite ease-in-out;
          z-index: 5;
        }
        .auth-input:focus {
          animation: focus-ring-pulse 2s infinite ease-in-out;
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.10), inset 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .dark .auth-input:focus {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.10), inset 0 2px 4px rgba(0,0,0,0.3) !important;
        }
        .feature-card {
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 0 20px rgba(59,130,246,0.03);
        }
        .dark .feature-card:hover {
          box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 0 20px rgba(59,130,246,0.06);
        }
      `}</style>

      {/* Background — Layered Depth System (Apple WWDC / Linear / Vercel aesthetic) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50 dark:bg-[#030816]">
        
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 z-20" style={{
          background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 20%, var(--body-bg) 100%)'
        }} />

        {/* Glow 1 — Primary bloom behind login card */}
        <div className="absolute top-[42%] left-[72%] -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#3B82F6]/5 dark:bg-[#3B82F6]/10 rounded-full blur-[170px] anim-pulse-glow" />
        {/* Glow 2 — Violet accent bottom-right */}
        <div className="absolute top-[65%] left-[82%] -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#7C3AED]/3 dark:bg-[#7C3AED]/7 rounded-full blur-[150px] anim-pulse-glow" style={{ animationDelay: '-4s' }} />
        {/* Glow 3 — Warm subtle behind left welcome text */}
        <div className="absolute top-[25%] left-[8%] w-[550px] h-[550px] bg-[#3B82F6]/3 dark:bg-[#3B82F6]/6 rounded-full blur-[140px]" />
        {/* Glow 4 — Faint top-center ambient */}
        <div className="absolute top-[-5%] left-[45%] -translate-x-1/2 w-[500px] h-[400px] bg-[#3B82F6]/2 dark:bg-[#3B82F6]/4 rounded-full blur-[120px]" />
        {/* Glow 5 — Bottom-left violet hint */}
        <div className="absolute top-[80%] left-[15%] w-[400px] h-[400px] bg-[#7C3AED]/2 dark:bg-[#7C3AED]/4 rounded-full blur-[130px]" />

        {/* Ultra-light dot texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.6" fill="#94A3B8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Premium flowing Bezier light trails — Apple WWDC style */}
        <svg className="absolute inset-0 w-full h-full anim-ribbon" viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trail-1" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="30%" stopColor="#3B82F6" stopOpacity="0.20" />
              <stop offset="60%" stopColor="#6366F1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trail-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
              <stop offset="40%" stopColor="#8B5CF6" stopOpacity="0.10" />
              <stop offset="70%" stopColor="#6366F1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trail-3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#1F4E79" stopOpacity="0" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#1F4E79" stopOpacity="0" />
            </linearGradient>
            <filter id="curve-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
            </filter>
            <filter id="curve-blur-soft">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5.0" />
            </filter>
          </defs>
          <path d="M -40,750 C 180,680 380,520 580,580 C 780,640 900,400 1100,350 C 1300,300 1440,200 1520,150" fill="none" stroke="url(#trail-1)" strokeWidth="1.8" filter="url(#curve-blur)" />
          <path d="M -40,780 C 200,720 400,560 600,610 C 800,660 920,430 1120,380 C 1320,330 1440,240 1520,190" fill="none" stroke="url(#trail-2)" strokeWidth="1.0" opacity="0.5" filter="url(#curve-blur)" />
          <path d="M -40,720 C 160,640 350,480 560,550 C 770,620 880,370 1080,320 C 1280,270 1440,160 1520,110" fill="none" stroke="url(#trail-1)" strokeWidth="5" opacity="0.12" filter="url(#curve-blur-soft)" />
          <path d="M -20,120 C 200,60 400,180 650,100 C 900,20 1100,140 1460,50" fill="none" stroke="url(#trail-3)" strokeWidth="0.8" opacity="0.25" filter="url(#curve-blur)" />
          <path d="M -20,850 C 150,820 350,870 600,830 C 850,790 1050,860 1460,820" fill="none" stroke="url(#trail-3)" strokeWidth="0.6" opacity="0.15" filter="url(#curve-blur)" />
        </svg>
      </div>

      {/* Left side - Branding, Feature List & Intro (Optimized spacing for vertical containment) */}
      <div className="relative z-10 w-full lg:w-[45%] flex flex-col justify-between p-10 lg:p-16 text-foreground dark:text-white min-h-[50vh] lg:min-h-screen">
        {/* Header Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={`${base}images/img.png`} 
            alt="Cybaem Tech Logo" 
            className="h-16 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </div>

        {/* Center welcome text and details */}
        <div className="my-auto py-6 space-y-10">
          <div className="space-y-4">
            <div className="text-[64px] lg:text-[68px] font-bold tracking-tight leading-[1.0] select-none text-slate-900 dark:text-white">
              Welcome <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] font-extrabold">Back!</span>
            </div>
            <p className="text-slate-600 dark:text-[#CBD5E1] text-[20px] max-w-md mt-3 font-normal leading-relaxed">
              Sign in to access your<br />HR management portal
            </p>
          </div>

          {/* Premium Feature Rows (Glass container panels, matching mockup screenshot) */}
          <div className="space-y-4 max-w-lg">
            {/* Feature 1 */}
            <div className="feature-card flex items-center gap-4 p-4 rounded-[16px] bg-white/75 border border-slate-200 dark:bg-[#111827]/60 dark:border-white/[0.08] backdrop-blur-2xl hover:bg-white/90 dark:hover:bg-[#111827]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.22)] group">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 text-[#3B82F6] dark:bg-[#0A1224] dark:border-[#1E3B68]/60 shadow-[0_0_12px_rgba(59,130,246,0.05)] dark:shadow-[0_0_12px_rgba(59,130,246,0.12)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] group-hover:border-[#3B82F6]/30 shrink-0 transition-all duration-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-[15px] leading-snug tracking-[-0.01em]">Secure & Protected</div>
                <p className="text-slate-500 dark:text-[#94A3B8] text-[13px] mt-0.5 leading-relaxed">
                  Enterprise-grade security keeps your data safe and confidential
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card flex items-center gap-4 p-4 rounded-[16px] bg-white/75 border border-slate-200 dark:bg-[#111827]/60 dark:border-white/[0.08] backdrop-blur-2xl hover:bg-white/90 dark:hover:bg-[#111827]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.22)] group">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 text-[#3B82F6] dark:bg-[#0A1224] dark:border-[#1E3B68]/60 shadow-[0_0_12px_rgba(59,130,246,0.05)] dark:shadow-[0_0_12px_rgba(59,130,246,0.12)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] group-hover:border-[#3B82F6]/30 shrink-0 transition-all duration-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-[15px] leading-snug tracking-[-0.01em]">Smart & Efficient</div>
                <p className="text-slate-500 dark:text-[#94A3B8] text-[13px] mt-0.5 leading-relaxed">
                  Streamline HR operations with intelligent automation
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card flex items-center gap-4 p-4 rounded-[16px] bg-white/75 border border-slate-200 dark:bg-[#111827]/60 dark:border-white/[0.08] backdrop-blur-2xl hover:bg-white/90 dark:hover:bg-[#111827]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.22)] group">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 text-[#3B82F6] dark:bg-[#0A1224] dark:border-[#1E3B68]/60 shadow-[0_0_12px_rgba(59,130,246,0.05)] dark:shadow-[0_0_12px_rgba(59,130,246,0.12)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] group-hover:border-[#3B82F6]/30 shrink-0 transition-all duration-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-[15px] leading-snug tracking-[-0.01em]">Modern Experience</div>
                <p className="text-slate-500 dark:text-[#94A3B8] text-[13px] mt-0.5 leading-relaxed">
                  Built for productivity and a seamless experience
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[13px] text-[#64748B] space-y-1">
          <p>© 2026 Cybaem Tech Pvt. Ltd. All rights reserved.</p>
          <p className="text-[#475569] dark:text-[#475569]">Empowering organizations through technology</p>
        </div>
      </div>

      {/* Right side - Stable Login Card (Optimized size and margins for viewport compliance) */}
      <div className="relative z-10 w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 min-h-[50vh] lg:min-h-screen">
        <div className="relative w-full max-w-[580px]">
          
          {/* Ambient card corner glow radial blooms */}
          <div className="absolute top-[-35px] left-[-35px] w-[220px] h-[220px] bg-[#3B82F6]/10 dark:bg-[#3B82F6]/18 rounded-full blur-[50px] pointer-events-none opacity-50 dark:opacity-100" />
          <div className="absolute bottom-[-35px] right-[-35px] w-[220px] h-[220px] bg-[#7C3AED]/8 dark:bg-[#7C3AED]/15 rounded-full blur-[50px] pointer-events-none opacity-50 dark:opacity-100" />
          {/* Subtle center bloom behind entire card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3B82F6]/3 dark:bg-[#3B82F6]/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Premium glass login card */}
          <div className="glass-card relative w-full bg-white/90 dark:bg-[#0f172a]/82 backdrop-blur-[30px] border border-slate-200 dark:border-white/[0.08] rounded-[28px] p-8 lg:p-12 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-[34px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                HR Connect
              </div>
              <p className="text-slate-600 dark:text-[#CBD5E1] text-[15px] mt-1.5">Comprehensive HR Management System</p>
              <div className="h-[2px] w-20 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] mx-auto mt-3.5 rounded-full" />
            </div>

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-6"
              >
                {/* Username Input */}
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="auth-label text-slate-900 dark:text-white font-bold text-[15px] block">
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative group/input">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within/input:text-[#3B82F6] transition-colors" />
                          <Input 
                            placeholder="Enter your username" 
                            className="auth-input w-full h-[54px] pl-14 bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#08111F]/70 dark:border-white/[0.08] dark:text-white text-base placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] rounded-2xl transition-all duration-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="auth-label text-slate-900 dark:text-white font-bold text-[15px] block">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group/input">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within/input:text-[#3B82F6] transition-colors" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="auth-input w-full h-[54px] pl-14 pr-14 bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#08111F]/70 dark:border-white/[0.08] dark:text-white text-base placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] rounded-2xl transition-all duration-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-sm font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Checkbox row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="remember-me" 
                      className="h-5 w-5 border border-slate-350 dark:border-white/20 bg-slate-50 dark:bg-[#08111F] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6] rounded" 
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="auth-label text-[15px] font-medium text-slate-650 dark:text-[#CBD5E1] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors !inline-block mb-0 mt-0.5"
                    >
                      Remember me
                    </label>
                  </div>
                  <a 
                    href="#forgot" 
                    className="text-[15px] text-[#3B82F6] hover:text-[#60A5FA] font-semibold transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Premium Gradient Submit Button (#3B82F6 -> #4F7DF8 -> #7C3AED) */}
                <Button
                  type="submit"
                  className="group relative w-full h-[54px] bg-gradient-to-r from-[#3B82F6] via-[#4F7DF8] to-[#7C3AED] hover:opacity-95 text-white shadow-[0_0_30px_rgba(59,130,246,0.15),0_4px_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3),0_4px_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.25),0_8px_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.4),0_8px_25px_rgba(59,130,246,0.25)] rounded-2xl font-bold text-base tracking-wide transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 border-0 overflow-hidden glow-button shimmer-sweep animate-none"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="bg-white dark:bg-[#0f172a] px-4 text-slate-500 dark:text-[#94A3B8] tracking-wide">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-5">
              <Button 
                variant="outline" 
                className="h-[54px] bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:bg-white/[0.02] dark:border-white/[0.08] dark:text-white dark:hover:bg-white/[0.06] dark:hover:border-white/[0.15] dark:hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ease-out text-base font-semibold hover:-translate-y-0.5 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] animate-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.95 1 12 1 7.37 1 3.44 3.66 1.5 7.55l3.75 2.91C6.15 6.78 8.84 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.72-4.92 3.72-8.6z" />
                  <path fill="#FBBC05" d="M5.25 14.73c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.5 7.2C.54 9.12 0 11.27 0 13.5s.54 4.38 1.5 6.3l3.75-2.91c-.24-.81-.38-1.63-.38-2.16z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.16 0-5.85-1.74-6.75-4.42l-3.75 2.91C3.44 20.34 7.37 23 12 23z" />
                </svg>
                <span className="text-slate-800 dark:text-white font-semibold">Google</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-[54px] bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 dark:bg-white/[0.02] dark:border-white/[0.08] dark:text-white dark:hover:bg-white/[0.06] dark:hover:border-white/[0.15] dark:hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ease-out text-base font-semibold hover:-translate-y-0.5 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] animate-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#F25022" d="M0 0h11v11H0z" />
                  <path fill="#7FBA00" d="M12 0h11v11H12z" />
                  <path fill="#00A4EF" d="M0 12h11v11H0z" />
                  <path fill="#FFB900" d="M12 12h11v11H12z" />
                </svg>
                <span className="text-slate-800 dark:text-white font-semibold">Microsoft</span>
              </Button>
            </div>

            {/* Lock secured footer */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Lock className="h-4 w-4 text-[#64748B]" />
              <span className="font-medium text-[13px] text-[#64748B]">Secure login powered by Cybaem Tech</span>
            </div>
          </div>

        </div>
      </div>
    </div>

  );
}
