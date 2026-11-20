// Eight Shot — gerado por ds_build.py. Segundos, prontos para GSAP/Motion.
export const dur = {
  "press": 0.06,
  "fast": 0.14,
  "med": 0.24,
  "pop": 0.42,
  "slow": 0.62,
  "draw": 0.72,
  "enter": 0.98
} as const

export const ease = {
  "out": "power2.out",
  "soft": "power2.inOut",
  "pop": "back.out(1.4)",
  "emerge": "expo.out"
} as const   // nomes GSAP

export const easeCss = {
  "out": "cubic-bezier(0.22, 0.61, 0.36, 1)",
  "soft": "cubic-bezier(0.4, 0, 0.2, 1)",
  "pop": "cubic-bezier(0.34, 1.4, 0.64, 1)",
  "emerge": "cubic-bezier(0.16, 0.84, 0.32, 1)"
} as const

export const stagger = {
  "reveal": 0.09,
  "hero": 0.14
} as const

export const scroll = {
  "smooth": false,
  "lerp": 0.12
} as const
