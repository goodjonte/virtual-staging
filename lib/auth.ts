import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Upsert user in Supabase
      const { error } = await getSupabaseAdmin().from("users").upsert(
        {
          email: user.email,
          name: user.name,
          avatar_url: user.image,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      if (error) console.error("Supabase upsert error:", error);
      return true;
    },

    async session({ session }) {
      if (!session.user?.email) return session;

      // Attach DB user data to session
      const { data: dbUser } = await getSupabaseAdmin()
        .from("users")
        .select("id, plan, renders_used, renders_limit, stripe_customer_id")
        .eq("email", session.user.email)
        .single();

      if (dbUser) {
        (session.user as any).id = dbUser.id;
        (session.user as any).plan = dbUser.plan;
        (session.user as any).rendersUsed = dbUser.renders_used;
        (session.user as any).rendersLimit = dbUser.renders_limit;
        (session.user as any).stripeCustomerId = dbUser.stripe_customer_id;
      }

      return session;
    },
  },
};
