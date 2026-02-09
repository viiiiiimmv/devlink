export const themes = {
  modern: {
    name: 'Modern',
    description: 'Electric blue and teal for clean product-like portfolios',
    preview: 'bg-gradient-to-br from-blue-600 to-teal-500',
    primary: '#2563eb',
    secondary: '#14b8a6',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      accent: 'text-blue-600',
      background: 'bg-slate-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200',
      hero: 'bg-gradient-to-br from-slate-100 via-blue-100 to-teal-100',
      section: 'bg-slate-50',
      card: 'bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300',
      button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all duration-200',
    }
  },
  gradient: {
    name: 'Gradient',
    description: 'Bold violet and rose with creative energy',
    preview: 'bg-gradient-to-br from-violet-600 to-rose-500',
    primary: '#7c3aed',
    secondary: '#f43f5e',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-violet-600',
      background: 'bg-rose-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-rose-200',
      hero: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white',
      section: 'bg-rose-50',
      card: 'bg-white border border-rose-200 shadow-md hover:shadow-lg hover:shadow-rose-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-500 hover:to-rose-400 text-white shadow-lg shadow-violet-500/30 transition-all duration-200',
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Neutral monochrome for a typography-first profile',
    preview: 'bg-gradient-to-br from-zinc-100 to-zinc-300',
    primary: '#111827',
    secondary: '#6b7280',
    colors: {
      primary: 'text-zinc-900',
      secondary: 'text-zinc-600',
      accent: 'text-zinc-800',
      background: 'bg-zinc-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/95 backdrop-blur-sm border-b border-zinc-200',
      hero: 'bg-zinc-100',
      section: 'bg-zinc-50',
      card: 'bg-white border border-zinc-200 hover:bg-zinc-50 transition-all duration-200',
      button: 'bg-zinc-900 hover:bg-zinc-800 text-white transition-all duration-200',
    }
  },
  ocean: {
    name: 'Ocean',
    description: 'Bright sea-blue palette with crisp contrast',
    preview: 'bg-gradient-to-br from-sky-500 to-blue-700',
    primary: '#0ea5e9',
    secondary: '#2563eb',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-sky-600',
      background: 'bg-sky-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-sky-200 shadow-sm',
      hero: 'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 text-white',
      section: 'bg-sky-50',
      card: 'bg-white border border-sky-200 shadow-md hover:shadow-lg hover:shadow-sky-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-md transition-all duration-200',
    }
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm peach-to-orange tones for expressive portfolios',
    preview: 'bg-gradient-to-br from-rose-400 to-orange-500',
    primary: '#fb7185',
    secondary: '#f97316',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-rose-600',
      background: 'bg-orange-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-orange-200 shadow-sm',
      hero: 'bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 text-white',
      section: 'bg-orange-50',
      card: 'bg-white border border-orange-200 shadow-md hover:shadow-lg hover:shadow-orange-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white shadow-md transition-all duration-200',
    }
  },
  forest: {
    name: 'Forest',
    description: 'Fresh green range for calm, nature-inspired design',
    preview: 'bg-gradient-to-br from-emerald-500 to-green-700',
    primary: '#22c55e',
    secondary: '#16a34a',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-emerald-700',
      background: 'bg-emerald-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-emerald-200 shadow-sm',
      hero: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white',
      section: 'bg-emerald-50',
      card: 'bg-white border border-emerald-200 shadow-md hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md transition-all duration-200',
    }
  },
  coral: {
    name: 'Coral',
    description: 'Pink-coral blend with modern social-app vibes',
    preview: 'bg-gradient-to-br from-pink-400 to-rose-600',
    primary: '#fb7185',
    secondary: '#e11d48',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-rose-600',
      background: 'bg-rose-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-rose-200 shadow-sm',
      hero: 'bg-gradient-to-br from-pink-400 via-rose-500 to-rose-600 text-white',
      section: 'bg-rose-50',
      card: 'bg-white border border-rose-200 shadow-md hover:shadow-lg hover:shadow-rose-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-md transition-all duration-200',
    }
  },
  aurora: {
    name: 'Aurora',
    description: 'Teal and violet inspired by northern-light gradients',
    preview: 'bg-gradient-to-br from-teal-400 to-violet-500',
    primary: '#14b8a6',
    secondary: '#8b5cf6',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-violet-600',
      background: 'bg-teal-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-teal-200 shadow-sm',
      hero: 'bg-gradient-to-br from-teal-400 via-cyan-400 to-violet-500 text-white',
      section: 'bg-teal-50',
      card: 'bg-white border border-teal-200 shadow-md hover:shadow-lg hover:shadow-teal-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-400 hover:to-violet-400 text-white shadow-md transition-all duration-200',
    }
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft lilac and indigo for elegant profiles',
    preview: 'bg-gradient-to-br from-fuchsia-400 to-indigo-500',
    primary: '#a855f7',
    secondary: '#6366f1',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-violet-700',
      background: 'bg-violet-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-violet-200 shadow-sm',
      hero: 'bg-gradient-to-br from-fuchsia-400 via-violet-400 to-indigo-500 text-white',
      section: 'bg-violet-50',
      card: 'bg-white border border-violet-200 shadow-md hover:shadow-lg hover:shadow-violet-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md transition-all duration-200',
    }
  },
  amber: {
    name: 'Amber',
    description: 'Golden amber with premium warm highlights',
    preview: 'bg-gradient-to-br from-amber-400 to-orange-500',
    primary: '#f59e0b',
    secondary: '#d97706',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-amber-700',
      background: 'bg-amber-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md border-b border-amber-200 shadow-sm',
      hero: 'bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 text-white',
      section: 'bg-amber-50',
      card: 'bg-white border border-amber-200 shadow-md hover:shadow-lg hover:shadow-amber-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md transition-all duration-200',
    }
  },
  dark: {
    name: 'Dark',
    description: 'Deep slate with neon-cyan accents',
    preview: 'bg-gradient-to-br from-slate-950 to-cyan-500',
    primary: '#22d3ee',
    secondary: '#3b82f6',
    colors: {
      primary: 'text-slate-50',
      secondary: 'text-slate-300',
      accent: 'text-cyan-400',
      background: 'bg-slate-950',
      card: 'bg-slate-900',
    },
    styles: {
      header: 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800',
      hero: 'bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white',
      section: 'bg-slate-950',
      card: 'bg-slate-900 border border-slate-800 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300',
      button: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200',
    }
  },
  midnight: {
    name: 'Midnight',
    description: 'Indigo-night base with soft violet glow',
    preview: 'bg-gradient-to-br from-indigo-950 to-purple-700',
    primary: '#818cf8',
    secondary: '#c084fc',
    colors: {
      primary: 'text-indigo-50',
      secondary: 'text-indigo-200',
      accent: 'text-purple-300',
      background: 'bg-indigo-950',
      card: 'bg-indigo-900',
    },
    styles: {
      header: 'bg-indigo-950/90 backdrop-blur-md border-b border-indigo-900',
      hero: 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white',
      section: 'bg-indigo-950',
      card: 'bg-indigo-900 border border-indigo-800 shadow-lg hover:shadow-purple-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg transition-all duration-200',
    }
  },
  steel: {
    name: 'Steel',
    description: 'Graphite and cool blue for technical portfolios',
    preview: 'bg-gradient-to-br from-slate-800 to-sky-500',
    primary: '#94a3b8',
    secondary: '#38bdf8',
    colors: {
      primary: 'text-slate-100',
      secondary: 'text-slate-300',
      accent: 'text-sky-400',
      background: 'bg-slate-900',
      card: 'bg-slate-800',
    },
    styles: {
      header: 'bg-slate-900/90 backdrop-blur-md border-b border-slate-700',
      hero: 'bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white',
      section: 'bg-slate-900',
      card: 'bg-slate-800 border border-slate-700 shadow-lg hover:shadow-sky-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-slate-600 to-sky-600 hover:from-slate-500 hover:to-sky-500 text-white shadow-md transition-all duration-200',
    }
  },
  fire: {
    name: 'Fire',
    description: 'Burnt red and ember orange for high contrast',
    preview: 'bg-gradient-to-br from-rose-700 to-orange-600',
    primary: '#fb7185',
    secondary: '#f97316',
    colors: {
      primary: 'text-rose-50',
      secondary: 'text-rose-200',
      accent: 'text-orange-300',
      background: 'bg-zinc-950',
      card: 'bg-zinc-900',
    },
    styles: {
      header: 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800',
      hero: 'bg-gradient-to-br from-zinc-950 via-rose-950 to-orange-950 text-white',
      section: 'bg-zinc-950',
      card: 'bg-zinc-900 border border-zinc-800 shadow-lg hover:shadow-rose-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white shadow-md transition-all duration-200',
    }
  },
  sapphire: {
    name: 'Sapphire',
    description: 'Royal blue on dark canvas for polished portfolios',
    preview: 'bg-gradient-to-br from-blue-900 to-indigo-600',
    primary: '#60a5fa',
    secondary: '#2563eb',
    colors: {
      primary: 'text-blue-50',
      secondary: 'text-blue-200',
      accent: 'text-blue-300',
      background: 'bg-slate-950',
      card: 'bg-slate-900',
    },
    styles: {
      header: 'bg-slate-950/90 backdrop-blur-md border-b border-blue-900/40',
      hero: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white',
      section: 'bg-slate-950',
      card: 'bg-slate-900 border border-blue-900/40 shadow-lg hover:shadow-blue-500/15 transition-all duration-300',
      button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition-all duration-200',
    }
  },
  obsidian: {
    name: 'Obsidian',
    description: 'New: black-purple depth with cyan edge lighting',
    preview: 'bg-gradient-to-br from-zinc-950 to-violet-700',
    primary: '#a78bfa',
    secondary: '#22d3ee',
    colors: {
      primary: 'text-violet-50',
      secondary: 'text-slate-300',
      accent: 'text-cyan-300',
      background: 'bg-black',
      card: 'bg-zinc-900',
    },
    styles: {
      header: 'bg-black/90 backdrop-blur-md border-b border-violet-900/40',
      hero: 'bg-gradient-to-br from-black via-zinc-950 to-violet-950 text-white',
      section: 'bg-black',
      card: 'bg-zinc-900 border border-violet-900/40 shadow-lg hover:shadow-violet-500/15 transition-all duration-300',
      button: 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white shadow-md transition-all duration-200',
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'New: yellow-magenta neon against dark surfaces',
    preview: 'bg-gradient-to-br from-fuchsia-700 to-yellow-400',
    primary: '#facc15',
    secondary: '#ec4899',
    colors: {
      primary: 'text-yellow-200',
      secondary: 'text-pink-200',
      accent: 'text-fuchsia-300',
      background: 'bg-slate-950',
      card: 'bg-slate-900',
    },
    styles: {
      header: 'bg-slate-950/90 backdrop-blur-md border-b border-fuchsia-900/40',
      hero: 'bg-gradient-to-br from-slate-950 via-fuchsia-950 to-yellow-950 text-white',
      section: 'bg-slate-950',
      card: 'bg-slate-900 border border-fuchsia-900/40 shadow-lg hover:shadow-fuchsia-500/15 transition-all duration-300',
      button: 'bg-gradient-to-r from-fuchsia-500 to-yellow-400 hover:from-fuchsia-400 hover:to-yellow-300 text-slate-950 shadow-md transition-all duration-200',
    }
  },
  noir: {
    name: 'Noir',
    description: 'New: high-contrast grayscale for minimalist dark mode',
    preview: 'bg-gradient-to-br from-black to-zinc-500',
    primary: '#e5e7eb',
    secondary: '#9ca3af',
    colors: {
      primary: 'text-zinc-100',
      secondary: 'text-zinc-400',
      accent: 'text-zinc-200',
      background: 'bg-black',
      card: 'bg-zinc-900',
    },
    styles: {
      header: 'bg-black/95 backdrop-blur-md border-b border-zinc-800',
      hero: 'bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white',
      section: 'bg-black',
      card: 'bg-zinc-900 border border-zinc-800 shadow-lg hover:shadow-zinc-500/10 transition-all duration-300',
      button: 'bg-zinc-200 hover:bg-zinc-100 text-zinc-900 shadow-md transition-all duration-200',
    }
  },
  matrix: {
    name: 'Matrix',
    description: 'New: terminal green palette for hacker aesthetics',
    preview: 'bg-gradient-to-br from-emerald-400 to-green-800',
    primary: '#4ade80',
    secondary: '#22c55e',
    colors: {
      primary: 'text-emerald-200',
      secondary: 'text-green-300',
      accent: 'text-lime-300',
      background: 'bg-black',
      card: 'bg-zinc-950',
    },
    styles: {
      header: 'bg-black/95 backdrop-blur-md border-b border-emerald-900/40',
      hero: 'bg-gradient-to-br from-black via-emerald-950 to-green-950 text-emerald-100',
      section: 'bg-black',
      card: 'bg-zinc-950 border border-emerald-900/40 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black shadow-md transition-all duration-200',
    }
  },
  volcanic: {
    name: 'Volcanic',
    description: 'New: lava reds and oranges over dark basalt',
    preview: 'bg-gradient-to-br from-red-700 to-orange-500',
    primary: '#f87171',
    secondary: '#fb923c',
    colors: {
      primary: 'text-rose-100',
      secondary: 'text-orange-200',
      accent: 'text-orange-300',
      background: 'bg-zinc-950',
      card: 'bg-zinc-900',
    },
    styles: {
      header: 'bg-zinc-950/90 backdrop-blur-md border-b border-rose-900/40',
      hero: 'bg-gradient-to-br from-zinc-950 via-red-950 to-orange-950 text-white',
      section: 'bg-zinc-950',
      card: 'bg-zinc-900 border border-rose-900/40 shadow-lg hover:shadow-orange-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-md transition-all duration-200',
    }
  },
}

export type ThemeName = keyof typeof themes
