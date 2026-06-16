/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        opv: {
          purple: '#602D66',
          green: '#3D7915',
        },
        sagia: {
          green: '#7B9D75',
          gold: '#D4A574',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
