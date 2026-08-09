(() => {
  "use strict";

  const cfg = window.GICOMM_CONFIG || {};
  const validConfig =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") &&
    !cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

  window.GicommAuth = {
    supabase: null,
    session: null,
    user: null,
    configured: validConfig,

    init() {
      if (!validConfig) {
        console.warn("[Gicomm] Supabase is not configured yet.");
        return Promise.resolve(null);
      }

      if (!window.supabase?.createClient) {
        console.error("[Gicomm] Supabase CDN failed to load.");
        return Promise.resolve(null);
      }

      this.supabase = window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      this.supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user ?? null;
        window.dispatchEvent(new CustomEvent("gicomm:auth", {
          detail: { event, session, user: this.user }
        }));
      });

      return this.supabase.auth.getSession().then(({ data }) => {
        this.session = data.session;
        this.user = data.session?.user ?? null;
        return this.session;
      });
    },

    async signInWithGoogle() {
      const redirectTo =
        window.location.hostname === "localhost"
          ? window.location.origin
          : "https://gicomm-ai.vercel.app";

      if (!this.supabase) {
        console.warn("[Gicomm] Supabase is not initialized.");
        return;
      }

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (error) {
        console.error("Google Login Error:", error);
        if (typeof showToast === "function") {
          showToast("Google Login gagal: " + error.message);
        }
        return;
      }

      console.log("Google OAuth started:", data);
    },

    async signOut() {
      if (!this.supabase) return;
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    }
  };

  window.GicommAuth.init();
})();
