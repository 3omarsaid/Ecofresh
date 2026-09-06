"use server";

import { createServerClientInstance } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف"),
});

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    };
  }

  const isLocalDev =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isLocalDev) {
    // In local development mode with placeholder keys, allow logging in directly
    redirect("/dashboard");
  }

  const supabase = createServerClientInstance();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "فشل تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة",
    };
  }

  redirect("/dashboard");
}
