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
      if (!this.supabase) {
        throw new Error("Supabase belum dikonfigurasi. Isi js/config.js terlebih dahulu.");
      }

      const redirectTo = window.location.origin + window.location.pathname;

      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });

      if (error) throw error;
    },

    async signOut() {
      if (!this.supabase) return;
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    }
  };

  window.GicommAuth.init();
})();
