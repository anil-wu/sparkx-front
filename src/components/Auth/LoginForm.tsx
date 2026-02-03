"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Zap,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import styles from "./LoginForm.module.css";

type Mode = "login" | "register";
type PendingAction = "login" | "register" | "google" | null;
type Message = {
  type: "error" | "success" | "info";
  text: string;
};

const REDIRECT_AFTER_AUTH = "/";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<Message | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pending, startTransition] = useTransition();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setMessage(null);
    setPendingAction(null);
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${-(index * 0.4)}s`,
        duration: `${16 + (index % 5) * 2}s`,
        opacity: 0.15 + ((index % 7) * 0.05),
      })),
    [],
  );

  const passwordStrength = useMemo(() => {
    const value = registerPassword;
    if (!value) {
      return {
        score: 0,
        label: "密码强度",
      };
    }

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^a-zA-Z\d]/.test(value)) score += 1;

    const labels = ["密码强度", "太弱", "弱", "中等", "强"];
    return {
      score,
      label: labels[score] ?? "密码强度",
    };
  }, [registerPassword]);

  const strengthColor = useMemo(() => {
    if (passwordStrength.score <= 1) return "bg-red-500";
    if (passwordStrength.score === 2) return "bg-orange-500";
    if (passwordStrength.score === 3) return "bg-yellow-500";
    return "bg-green-500";
  }, [passwordStrength.score]);

  const isLoginSubmitting = pending && pendingAction === "login";
  const isRegisterSubmitting = pending && pendingAction === "register";
  const isGoogleSubmitting = pending && pendingAction === "google";

  const handleGoogle = () => {
    setMessage(null);
    setPendingAction("google");

    startTransition(() => {
      void (async () => {
        const result = await authClient.signIn.social({
          provider: "google",
          callbackURL: REDIRECT_AFTER_AUTH,
        });

        if (result?.error) {
          setMessage({
            type: "error",
            text: result.error.message ?? "Google 登录失败，请重试。",
          });
          setPendingAction(null);
        }
      })();
    });
  };

  const handleApple = () => {
    setMessage({
      type: "info",
      text: "Apple 登录功能即将上线。",
    });
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setMessage({
        type: "error",
        text: "请输入邮箱和密码。",
      });
      return;
    }

    setPendingAction("login");
    startTransition(() => {
      void (async () => {
        const result = await authClient.signIn.email({
          email: loginEmail.trim(),
          password: loginPassword,
          rememberMe,
          callbackURL: REDIRECT_AFTER_AUTH,
        });

        if (result?.error) {
          setMessage({
            type: "error",
            text: result.error.message ?? "登录失败，请重试。",
          });
          setPendingAction(null);
          return;
        }

        setMessage({
          type: "success",
          text: "登录成功，正在跳转...",
        });
        router.push(REDIRECT_AFTER_AUTH);
        router.refresh();
      })();
    });
  };

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (registerName.trim().length < 2) {
      setMessage({
        type: "error",
        text: "用户名至少 2 个字符。",
      });
      return;
    }

    if (registerPassword.length < 8) {
      setMessage({
        type: "error",
        text: "密码至少 8 位。",
      });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setMessage({
        type: "error",
        text: "两次输入的密码不一致。",
      });
      return;
    }

    if (!agreeTerms) {
      setMessage({
        type: "error",
        text: "请先同意使用条款与隐私政策。",
      });
      return;
    }

    setPendingAction("register");
    startTransition(() => {
      void (async () => {
        const result = await authClient.signUp.email({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
          callbackURL: REDIRECT_AFTER_AUTH,
        });

        if (result?.error) {
          setMessage({
            type: "error",
            text: result.error.message ?? "注册失败，请重试。",
          });
          setPendingAction(null);
          return;
        }

        setLoginEmail(registerEmail.trim());
        setLoginPassword("");
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setAgreeTerms(false);
        setMode("login");
        window.history.replaceState(null, "", window.location.pathname);
        setMessage({
          type: "success",
          text: "账号创建成功，请登录。",
        });
        setPendingAction(null);
      })();
    });
  };

  return (
    <div
      className={`${styles.gradientBg} relative flex min-h-screen items-center justify-center p-4`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={styles.particle}
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-yellow-400">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Spark<span className="text-orange-400">X</span>
          </span>
        </div>

        <div
          className={`${styles.glassCard} relative overflow-hidden rounded-3xl shadow-2xl`}
        >
          <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400" />

          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className={`flex-1 cursor-pointer py-4 text-sm font-medium transition-colors ${
                mode === "login" ? styles.tabActive : styles.tabInactive
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className={`flex-1 cursor-pointer py-4 text-sm font-medium transition-colors ${
                mode === "register" ? styles.tabActive : styles.tabInactive
              }`}
            >
              注册账号
            </button>
          </div>

          <div className="min-h-[620px] space-y-6 p-8">
            {mode === "login" ? (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                    欢迎回来
                  </h2>
                  <p className="text-sm text-gray-500">
                    登录以继续您的创作之旅
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={pending}
                    className={`${styles.socialBtn} flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-white py-2.5 disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isGoogleSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-700 motion-reduce:animate-none" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Google
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApple}
                    className={`${styles.socialBtn} flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-white py-2.5`}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="black"
                      aria-hidden="true"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zm-5.85-15.1c.07-2.04 1.76-3.89 3.75-4.12.29 2.32-2.07 4.46-3.75 4.12z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Apple
                    </span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="bg-transparent px-3 text-xs text-gray-400">
                    或使用邮箱
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <div className="relative">
                  <input
                    type="email"
                    id="login-email"
                    name="login-email"
                    value={loginEmail}
                    onChange={(event) => {
                      setLoginEmail(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="email"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3.5 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="login-email" className={styles.floatingLabel}>
                    电子邮箱
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    name="login-password"
                    value={loginPassword}
                    onChange={(event) => {
                      setLoginPassword(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="current-password"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3.5 pr-10 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="login-password" className={styles.floatingLabel}>
                    密码
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-3.5 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showLoginPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="group flex cursor-pointer items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-gray-600 transition-colors group-hover:text-gray-800">
                      记住我
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setMessage({
                        type: "info",
                        text: "忘记密码功能即将上线。",
                      })
                    }
                    className="cursor-pointer font-medium text-orange-600 transition-colors hover:text-orange-700"
                  >
                    忘记密码？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className={`${styles.btnGradient} flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {isLoginSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                      <span>登录中...</span>
                    </>
                  ) : message?.type === "success" ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>登录成功</span>
                    </>
                  ) : (
                    <>
                      <span>登录</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                    创建账号
                  </h2>
                  <p className="text-sm text-gray-500">加入 SparkX 开始创新之旅</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="reg-username"
                    name="reg-username"
                    value={registerName}
                    onChange={(event) => {
                      setRegisterName(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="name"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="reg-username" className={styles.floatingLabel}>
                    用户名
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    id="reg-email"
                    name="reg-email"
                    value={registerEmail}
                    onChange={(event) => {
                      setRegisterEmail(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="email"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="reg-email" className={styles.floatingLabel}>
                    电子邮箱
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    id="reg-password"
                    name="reg-password"
                    value={registerPassword}
                    onChange={(event) => {
                      setRegisterPassword(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="new-password"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="reg-password" className={styles.floatingLabel}>
                    设置密码
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute right-3 top-3 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showRegisterPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="min-h-[34px]">
                  {registerPassword.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex h-1 space-x-1">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-full transition-colors ${
                              index < passwordStrength.score
                                ? strengthColor
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        密码强度: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    id="reg-confirm"
                    name="reg-confirm"
                    value={registerConfirmPassword}
                    onChange={(event) => {
                      setRegisterConfirmPassword(event.target.value);
                      setMessage(null);
                    }}
                    disabled={pending}
                    placeholder=" "
                    required
                    autoComplete="new-password"
                    className={`${styles.inputField} w-full rounded-xl bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  <label htmlFor="reg-confirm" className={styles.floatingLabel}>
                    确认密码
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowRegisterConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-3 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={
                      showRegisterConfirmPassword ? "隐藏密码" : "显示密码"
                    }
                  >
                    {showRegisterConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <label className="flex cursor-pointer items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(event) => setAgreeTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs leading-relaxed text-gray-500">
                    我已阅读并同意
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-orange-600 hover:underline"
                    >
                      使用条款
                    </button>
                    和
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-orange-600 hover:underline"
                    >
                      隐私政策
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={pending}
                  className={`${styles.btnGradient} flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {isRegisterSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                      <span>创建中...</span>
                    </>
                  ) : (
                    <>
                      <span>创建账号</span>
                      <UserPlus className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="min-h-[52px]">
              <div
                className={`rounded-xl border px-4 py-3 text-sm transition-opacity ${
                  message
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                } ${
                  message?.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : message?.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
                role="alert"
                aria-live="polite"
                aria-hidden={!message}
              >
                {message?.text ?? "\u00A0"}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2 text-center">
              <p className="text-xs text-gray-400">
                受 reCAPTCHA 保护并适用
                <br />
                <button
                  type="button"
                  className="cursor-pointer hover:text-gray-600"
                >
                  隐私政策
                </button>
                {" 和 "}
                <button
                  type="button"
                  className="cursor-pointer hover:text-gray-600"
                >
                  服务条款
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
