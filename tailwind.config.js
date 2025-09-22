/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {                 // your palette (kept)
          bg: "#0C0D1A",
          panel: "#121328",
          neon: "#B5FF15",
          accent: "#8A70FF",
          hot: "#FF3D81"
        },
        flow: {                  // Flowfest-ish palette
          cream: "#F6EFD9",
          ink: "#151515",
          orange: "#F39121",
          pink: "#F683A2",
          yellow: "#F2C200",
          dark: "#101010"
        }
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(10px,-20px) scale(1.05)" },
          "66%": { transform: "translate(-15px,10px) scale(0.98)" }
        }
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        blob: "blob 12s ease-in-out infinite"
      },
      boxShadow: {
        glow: "0 0 30px 0 rgba(181,255,21,0.35)",
        glowPink: "0 0 30px 0 rgba(255,61,129,0.35)",
        sticker: "0 6px 0 rgba(0,0,0,.45)",
        card: "0 10px 30px rgba(0,0,0,.25)"
      },
      borderRadius: { xl2: "1.25rem" },
      backdropBlur: { xs: "2px" }
    }
  },
  plugins: []
};
