export const PROFILE_THEME_SEQUENCE = [
  'modern',
  'gradient',
  'minimal',
  'ocean',
  'sunset',
  'forest',
  'coral',
  'aurora',
  'lavender',
  'amber',
  'dark',
  'midnight',
  'steel',
  'fire',
  'sapphire',
  'obsidian',
  'cyberpunk',
  'noir',
  'matrix',
  'volcanic',
] as const

export type ProfileThemeId = (typeof PROFILE_THEME_SEQUENCE)[number]
export type ThemeTone = 'light' | 'dark'

export const PROFILE_TEMPLATE_SEQUENCE = [
  'editorial',
  'bento',
  'terminal',
  'glass',
] as const

export type ProfileTemplateId = (typeof PROFILE_TEMPLATE_SEQUENCE)[number]
export const PROFILE_SECTION_SEQUENCE = [
  'skills',
  'projects',
  'experience',
  'testimonials',
  'certifications',
  'research',
] as const

export type ProfileSectionId = (typeof PROFILE_SECTION_SEQUENCE)[number]
export type ProfileSectionSetting = {
  id: ProfileSectionId
  visible: boolean
}

export const DEFAULT_PROFILE_THEME: ProfileThemeId = 'modern'
export const DEFAULT_PROFILE_TEMPLATE: ProfileTemplateId = 'editorial'
export const DEFAULT_SECTION_SETTINGS: ProfileSectionSetting[] = PROFILE_SECTION_SEQUENCE.map((id) => ({
  id,
  visible: true,
}))

export const themeOptions: Array<{
  id: ProfileThemeId
  name: string
  description: string
  preview: string
  tone: ThemeTone
}> = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Electric blue and teal for clean product-like portfolios',
    preview: 'bg-gradient-to-br from-blue-600 to-teal-500',
    tone: 'light',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Bold violet and rose with creative energy',
    preview: 'bg-gradient-to-br from-violet-600 to-rose-500',
    tone: 'light',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Neutral monochrome for a typography-first profile',
    preview: 'bg-gradient-to-br from-zinc-100 to-zinc-300',
    tone: 'light',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Bright sea-blue palette with crisp contrast',
    preview: 'bg-gradient-to-br from-sky-500 to-blue-700',
    tone: 'light',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm peach-to-orange tones for expressive portfolios',
    preview: 'bg-gradient-to-br from-rose-400 to-orange-500',
    tone: 'light',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Fresh green range for calm, nature-inspired design',
    preview: 'bg-gradient-to-br from-emerald-500 to-green-700',
    tone: 'light',
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Pink-coral blend with modern social-app vibes',
    preview: 'bg-gradient-to-br from-pink-400 to-rose-600',
    tone: 'light',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Teal and violet inspired by northern-light gradients',
    preview: 'bg-gradient-to-br from-teal-400 to-violet-500',
    tone: 'light',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft lilac and indigo for elegant profiles',
    preview: 'bg-gradient-to-br from-fuchsia-400 to-indigo-500',
    tone: 'light',
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Golden amber with premium warm highlights',
    preview: 'bg-gradient-to-br from-amber-400 to-orange-500',
    tone: 'light',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Deep slate with neon-cyan accents',
    preview: 'bg-gradient-to-br from-slate-950 to-cyan-500',
    tone: 'dark',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Indigo-night base with soft violet glow',
    preview: 'bg-gradient-to-br from-indigo-950 to-purple-700',
    tone: 'dark',
  },
  {
    id: 'steel',
    name: 'Steel',
    description: 'Graphite and cool blue for technical portfolios',
    preview: 'bg-gradient-to-br from-slate-800 to-sky-500',
    tone: 'dark',
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Burnt red and ember orange for high contrast',
    preview: 'bg-gradient-to-br from-rose-700 to-orange-600',
    tone: 'dark',
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    description: 'Royal blue on dark canvas for polished portfolios',
    preview: 'bg-gradient-to-br from-blue-900 to-indigo-600',
    tone: 'dark',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'New: black-purple depth with cyan edge lighting',
    preview: 'bg-gradient-to-br from-zinc-950 to-violet-700',
    tone: 'dark',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'New: yellow-magenta neon against dark surfaces',
    preview: 'bg-gradient-to-br from-fuchsia-700 to-yellow-400',
    tone: 'dark',
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'New: high-contrast grayscale for minimalist dark mode',
    preview: 'bg-gradient-to-br from-black to-zinc-500',
    tone: 'dark',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'New: terminal green palette for hacker aesthetics',
    preview: 'bg-gradient-to-br from-emerald-400 to-green-800',
    tone: 'dark',
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    description: 'New: lava reds and oranges over dark basalt',
    preview: 'bg-gradient-to-br from-red-700 to-orange-500',
    tone: 'dark',
  },
]

export const templateOptions: Array<{
  id: ProfileTemplateId
  name: string
  description: string
  vibe: string
  preview: string
}> = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Your current bold hero layout with high-contrast storytelling',
    vibe: 'Current',
    preview: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700',
  },
  {
    id: 'bento',
    name: 'Bento Grid',
    description: 'Product-style dashboard layout with modular cards and fast scanning',
    vibe: 'Modern Product',
    preview: 'bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'CLI-inspired portfolio with command-line aesthetics for developer-first branding',
    vibe: 'Hacker Console',
    preview: 'bg-gradient-to-br from-black via-zinc-900 to-emerald-900',
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Soft glassmorphism layout with layered blur and gradient atmosphere',
    vibe: 'Futuristic',
    preview: 'bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-400',
  },
]

export const VALID_THEME_IDS = [...PROFILE_THEME_SEQUENCE]
export const VALID_TEMPLATE_IDS = [...PROFILE_TEMPLATE_SEQUENCE]
export const VALID_SECTION_IDS = [...PROFILE_SECTION_SEQUENCE]

export const sectionOptions: Array<{
  id: ProfileSectionId
  name: string
  description: string
}> = [
  {
    id: 'skills',
    name: 'Skills',
    description: 'Technology stack and core strengths',
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Featured and recent work highlights',
  },
  {
    id: 'experience',
    name: 'Experience',
    description: 'Roles and professional timeline',
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Recommendations and social proof',
  },
  {
    id: 'certifications',
    name: 'Certifications',
    description: 'Credentials and achievements',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Articles, papers, and publications',
  },
]

export const isValidTheme = (value: string): value is ProfileThemeId =>
  (VALID_THEME_IDS as readonly string[]).includes(value)

export const isValidTemplate = (value: string): value is ProfileTemplateId =>
  (VALID_TEMPLATE_IDS as readonly string[]).includes(value)

export const isValidSectionId = (value: string): value is ProfileSectionId =>
  (VALID_SECTION_IDS as readonly string[]).includes(value)

export const normalizeSectionSettings = (value: unknown): ProfileSectionSetting[] => {
  const defaults = DEFAULT_SECTION_SETTINGS.map((setting) => ({ ...setting }))
  if (!Array.isArray(value)) {
    return defaults
  }

  const seen = new Set<ProfileSectionId>()
  const normalized: ProfileSectionSetting[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object') continue

    const rawId = (item as { id?: unknown }).id
    if (typeof rawId !== 'string' || !isValidSectionId(rawId) || seen.has(rawId)) {
      continue
    }

    const rawVisible = (item as { visible?: unknown }).visible
    normalized.push({
      id: rawId,
      visible: typeof rawVisible === 'boolean' ? rawVisible : true,
    })
    seen.add(rawId)
  }

  for (const fallback of defaults) {
    if (!seen.has(fallback.id)) {
      normalized.push(fallback)
      seen.add(fallback.id)
    }
  }

  return normalized
}
