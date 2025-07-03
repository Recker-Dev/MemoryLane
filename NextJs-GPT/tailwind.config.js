// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        '3xl': '1.75rem', // 28px
        '4xl': '2rem',    // 32px
      },
    },
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",    // For pages
    "./components/**/*.{js,ts,jsx,tsx}", // For components
    "./app/**/*.{js,ts,jsx,tsx}",     // For Next.js App Router (if applicable)
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  plugins: [],
}
