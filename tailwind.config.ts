import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#020617",
        panel: "#0b1224",
        panelSoft: "#111a33",
        line: "#223154",
        accent: "#6d7cff",
        accentDeep: "#4f46e5",
        textMain: "#f1f5f9",
        textMuted: "#94a3b8",
        success: "#22c55e",
        danger: "#ef4444",
        warn: "#f59e0b"
      },
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        frame: "0 32px 80px rgba(0,0,0,.45)"
      },
      borderRadius: {
        frame: "22px"
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(109,124,255,.22) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(79,70,229,.16) 0%, transparent 55%)"
      }
    }
  },
  plugins: []
};

export default config;
