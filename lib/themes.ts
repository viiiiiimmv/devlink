export const themes = {
  modern: {
    name: 'Modern',
    description: 'Clean and minimalist design',
    preview: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    colors: {
      primary: 'text-blue-800',
      secondary: 'text-white',
      accent: 'text-indigo-700',
      background: 'bg-white',
      card: 'bg-gray-50',
    },
    styles: {
      header: 'bg-white shadow-sm border-b',
      hero: 'bg-gradient-to-r from-blue-50 to-indigo-100',
      section: 'bg-white',
      card: 'bg-gray-50 hover:bg-gray-100 border border-gray-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    }
  },
  dark: {
    name: 'Dark',
    description: 'Sleek dark theme for night owls',
    preview: 'bg-gradient-to-br from-gray-800 to-gray-900',
    colors: {
      primary: 'text-white',
      secondary: 'text-white',
      accent: 'text-purple-300',
      background: 'bg-gray-900',
      card: 'bg-gray-800',
    },
    styles: {
      header: 'bg-gray-900 border-b border-gray-800',
      hero: 'bg-gradient-to-r from-gray-800 to-gray-900',
      section: 'bg-gray-900',
      card: 'bg-gray-800 hover:bg-gray-700 border border-gray-800', // more subtle border
      button: 'bg-blue-600 hover:bg-blue-500 text-white',
    }
  },
  gradient: {
    name: 'Gradient',
    description: 'Vibrant gradients and colors',
    preview: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500',
    colors: {
      primary: 'text-purple-800',
      secondary: 'text-white',
      accent: 'text-pink-700',
      background: 'bg-white',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white shadow-sm border-b',
      hero: 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500',
      section: 'bg-white',
      card: 'bg-white hover:shadow-md border border-purple-100',
      button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Ultra-clean and simple',
    preview: 'bg-gradient-to-br from-gray-50 to-white',
    colors: {
      primary: 'text-gray-900',
      secondary: 'text-white',
      accent: 'text-gray-900',
      background: 'bg-white',
      card: 'bg-gray-50',
    },
    styles: {
      header: 'bg-white border-b border-gray-100',
      hero: 'bg-gray-50',
      section: 'bg-white',
      card: 'bg-white hover:bg-gray-50 border border-gray-100',
      button: 'bg-gray-900 hover:bg-gray-800 text-white',
    }
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue ocean-inspired theme',
    preview: 'bg-gradient-to-br from-blue-600 to-teal-600',
    colors: {
      primary: 'text-blue-900',
      secondary: 'text-white',
      accent: 'text-teal-700',
      background: 'bg-gradient-to-br from-blue-50 to-teal-50',
      card: 'bg-white/80 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-blue-200',
      hero: 'bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 text-white',
      section: 'bg-gradient-to-br from-blue-50 to-teal-50',
      card: 'bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm orange and red gradient',
    preview: 'bg-gradient-to-br from-orange-500 to-red-500',
    colors: {
      primary: 'text-orange-800',
      secondary: 'text-white',
      accent: 'text-red-700',
      background: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-orange-200',
      hero: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 text-white',
      section: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-orange-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  forest: {
    name: 'Forest',
    description: 'Nature-inspired green theme',
    preview: 'bg-gradient-to-br from-green-600 to-emerald-600',
    colors: {
      primary: 'text-green-900',
      secondary: 'text-white',
      accent: 'text-emerald-700',
      background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
      card: 'bg-white/80 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-green-200',
      hero: 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white',
      section: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
      card: 'bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-green-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep purple and blue for night owls',
    preview: 'bg-gradient-to-br from-indigo-800 to-purple-900',
    colors: {
      primary: 'text-indigo-900',
      secondary: 'text-white',
      accent: 'text-purple-800',
      background: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50',
      card: 'bg-white/75 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/85 backdrop-blur-sm shadow-lg border-b border-indigo-900',
      hero: 'bg-gradient-to-br from-indigo-700 via-purple-800 to-violet-900 text-white',
      section: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50',
      card: 'bg-white/75 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-indigo-900/40 transition-all duration-300', // subtle border
      button: 'bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 hover:from-indigo-800 hover:via-purple-800 hover:to-violet-800 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  coral: {
    name: 'Coral',
    description: 'Vibrant coral and pink for creative developers',
    preview: 'bg-gradient-to-br from-pink-400 to-rose-500',
    colors: {
      primary: 'text-pink-800',
      secondary: 'text-white',
      accent: 'text-rose-700',
      background: 'bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-pink-200',
      hero: 'bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-500 text-white',
      section: 'bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-pink-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 hover:from-pink-600 hover:via-rose-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  steel: {
    name: 'Steel',
    description: 'Industrial gray and silver for technical portfolios',
    preview: 'bg-gradient-to-br from-slate-600 to-gray-700',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-white',
      accent: 'text-gray-900',
      background: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      card: 'bg-white/90 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-slate-800',
      hero: 'bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800 text-white',
      section: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      card: 'bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-slate-800/40 transition-all duration-300', // subtle border
      button: 'bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 hover:from-slate-700 hover:via-gray-700 hover:to-zinc-700 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  aurora: {
    name: 'Aurora',
    description: 'Northern lights inspired with green and blue',
    preview: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
    colors: {
      primary: 'text-emerald-900',
      secondary: 'text-white',
      accent: 'text-cyan-800',
      background: 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50',
      card: 'bg-white/80 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-emerald-200',
      hero: 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 text-white',
      section: 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50',
      card: 'bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-emerald-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  fire: {
    name: 'Fire',
    description: 'Hot red and orange for passionate developers',
    preview: 'bg-gradient-to-br from-red-600 to-orange-600',
    colors: {
      primary: 'text-red-800',
      secondary: 'text-white',
      accent: 'text-orange-800',
      background: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-red-200',
      hero: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 text-white',
      section: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-red-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft purple theme for elegant portfolios',
    preview: 'bg-gradient-to-br from-purple-400 to-violet-500',
    colors: {
      primary: 'text-purple-900',
      secondary: 'text-white',
      accent: 'text-violet-900',
      background: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-purple-200',
      hero: 'bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-500 text-white',
      section: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-purple-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 hover:from-purple-600 hover:via-violet-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  sapphire: {
    name: 'Sapphire',
    description: 'Rich blue theme for professional developers',
    preview: 'bg-gradient-to-br from-blue-700 to-indigo-700',
    colors: {
      primary: 'text-blue-900',
      secondary: 'text-white',
      accent: 'text-indigo-900',
      background: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-blue-200',
      hero: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 text-white',
      section: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-blue-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  },
  amber: {
    name: 'Amber',
    description: 'Golden amber theme for experienced developers',
    preview: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    colors: {
      primary: 'text-amber-900',
      secondary: 'text-white',
      accent: 'text-yellow-900',
      background: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
      card: 'bg-white/85 backdrop-blur-sm',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-sm shadow-lg border-b border-amber-200',
      hero: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white',
      section: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
      card: 'bg-white/85 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl border border-amber-200/50 transition-all duration-300',
      button: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300',
    }
  }
}

export type ThemeName = keyof typeof themes