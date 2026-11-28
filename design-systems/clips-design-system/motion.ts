// Clips — gerado por ds_build.py. Segundos, prontos para GSAP/Motion.
export const dur = {
  "press": 0.15,
  "fast": 0.15,
  "base": 0.2,
  "menu": 0.22,
  "modal": 0.28,
  "beat": 0.484,
  "bar": 1.936,
  "phrase": 7.742
} as const

export const ease = {
  "snap": "power3.out",
  "expo-out": "expo.out",
  "pulse": "power1.out",
  "cut": "steps(1)",
  "scrub": "none"
} as const   // nomes GSAP

export const easeCss = {
  "snap": "cubic-bezier(0.2, 0.8, 0.2, 1)",
  "expo-out": "cubic-bezier(0.075, 0.82, 0.165, 1)",
  "pulse": "ease-out",
  "cut": "steps(1)",
  "scrub": "linear"
} as const

export const stagger = {
  "word": 0.484,
  "star": 0.07
} as const

export const scroll = {
  "smooth": false
} as const
