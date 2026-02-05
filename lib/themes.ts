export const themes = {
  modern: {
    name: 'Modern',
    description: 'Clean and minimalist design',
    preview: 'bg-gradient-to-br from-slate-50 to-blue-50',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      accent: 'text-blue-600',
      background: 'bg-white',
      card: 'bg-slate-50',
    },
    styles: {
      header: 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200',
      hero: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
      section: 'bg-white',
      card: 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300',
      button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all duration-200',
    }
  },
  dark: {
    name: 'Dark',
    description: 'Sleek dark theme with cyan accents',
    preview: 'bg-gradient-to-br from-slate-900 to-slate-800',
    colors: {
      primary: 'text-slate-50',
      secondary: 'text-slate-400',
      accent: 'text-cyan-400',
      background: 'bg-slate-950',
      card: 'bg-slate-900',
    },
    styles: {
      header: 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800',
      hero: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      section: 'bg-slate-950',
      card: 'bg-slate-900 hover:bg-slate-800 border border-slate-800 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300',
      button: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-200',
    }
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Bold colors with high energy',
    preview: 'bg-gradient-to-br from-fuchsia-500 to-violet-600',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-fuchsia-600',
      background: 'bg-slate-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200',
      hero: 'bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 text-white',
      section: 'bg-slate-50',
      card: 'bg-white hover:bg-slate-50 border border-slate-200 shadow-md hover:shadow-lg hover:shadow-fuchsia-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-all duration-200',
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Ultra-clean monochromatic design',
    preview: 'bg-gradient-to-br from-neutral-100 to-neutral-200',
    colors: {
      primary: 'text-neutral-950',
      secondary: 'text-neutral-600',
      accent: 'text-neutral-900',
      background: 'bg-neutral-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/95 backdrop-blur-sm border-b border-neutral-200',
      hero: 'bg-neutral-100',
      section: 'bg-neutral-50',
      card: 'bg-white hover:bg-neutral-50 border border-neutral-200 transition-all duration-200',
      button: 'bg-neutral-950 hover:bg-neutral-800 text-white transition-all duration-200',
    }
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue with teal accents',
    preview: 'bg-gradient-to-br from-sky-500 to-cyan-600',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-cyan-600',
      background: 'bg-sky-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-200',
      hero: 'bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-600 text-white',
      section: 'bg-sky-50',
      card: 'bg-white hover:bg-sky-50 border border-sky-200 shadow-md hover:shadow-lg hover:shadow-sky-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200',
    }
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm amber and coral tones',
    preview: 'bg-gradient-to-br from-amber-400 to-rose-500',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-rose-600',
      background: 'bg-amber-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-amber-200',
      hero: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white',
      section: 'bg-amber-50',
      card: 'bg-white hover:bg-amber-50 border border-amber-200 shadow-md hover:shadow-lg hover:shadow-orange-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-200',
    }
  },
  forest: {
    name: 'Forest',
    description: 'Natural green with earthy tones',
    preview: 'bg-gradient-to-br from-emerald-500 to-green-600',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-emerald-600',
      background: 'bg-emerald-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-200',
      hero: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white',
      section: 'bg-emerald-50',
      card: 'bg-white hover:bg-emerald-50 border border-emerald-200 shadow-md hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200',
    }
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep indigo with purple accents',
    preview: 'bg-gradient-to-br from-indigo-900 to-purple-900',
    colors: {
      primary: 'text-indigo-50',
      secondary: 'text-indigo-300',
      accent: 'text-purple-400',
      background: 'bg-slate-950',
      card: 'bg-indigo-950',
    },
    styles: {
      header: 'bg-indigo-950/80 backdrop-blur-md border-b border-indigo-900',
      hero: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white',
      section: 'bg-slate-950',
      card: 'bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 shadow-lg hover:shadow-purple-500/10 transition-all duration-300',
      button: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200',
    }
  },
  coral: {
    name: 'Coral',
    description: 'Soft coral and pink with warmth',
    preview: 'bg-gradient-to-br from-coral-400 to-pink-500',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-pink-600',
      background: 'bg-rose-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-rose-200',
      hero: 'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 text-white',
      section: 'bg-rose-50',
      card: 'bg-white hover:bg-rose-50 border border-rose-200 shadow-md hover:shadow-lg hover:shadow-pink-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200',
    }
  },
  steel: {
    name: 'Steel',
    description: 'Industrial gray with blue undertones',
    preview: 'bg-gradient-to-br from-slate-600 to-zinc-700',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      accent: 'text-blue-600',
      background: 'bg-slate-100',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-300',
      hero: 'bg-gradient-to-br from-slate-700 via-zinc-700 to-slate-800 text-white',
      section: 'bg-slate-100',
      card: 'bg-white hover:bg-slate-50 border border-slate-300 shadow-md hover:shadow-lg transition-all duration-300',
      button: 'bg-slate-800 hover:bg-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200',
    }
  },
  aurora: {
    name: 'Aurora',
    description: 'Northern lights with teal and violet',
    preview: 'bg-gradient-to-br from-teal-400 to-violet-500',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-violet-600',
      background: 'bg-teal-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-teal-200',
      hero: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-violet-500 text-white',
      section: 'bg-teal-50',
      card: 'bg-white hover:bg-teal-50 border border-teal-200 shadow-md hover:shadow-lg hover:shadow-violet-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-400 hover:to-violet-400 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200',
    }
  },
  ember: {
    name: 'Ember',
    description: 'Fiery red with orange warmth',
    preview: 'bg-gradient-to-br from-red-500 to-orange-600',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-red-600',
      background: 'bg-orange-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-orange-200',
      hero: 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white',
      section: 'bg-orange-50',
      card: 'bg-white hover:bg-orange-50 border border-orange-200 shadow-md hover:shadow-lg hover:shadow-red-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200',
    }
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft purple with elegant undertones',
    preview: 'bg-gradient-to-br from-purple-300 to-violet-400',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-purple-600',
      background: 'bg-purple-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-200',
      hero: 'bg-gradient-to-br from-purple-400 via-violet-400 to-indigo-500 text-white',
      section: 'bg-purple-50',
      card: 'bg-white hover:bg-purple-50 border border-purple-200 shadow-md hover:shadow-lg hover:shadow-purple-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200',
    }
  },
  sapphire: {
    name: 'Sapphire',
    description: 'Rich royal blue with depth',
    preview: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-blue-700',
      background: 'bg-blue-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-blue-200',
      hero: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white',
      section: 'bg-blue-50',
      card: 'bg-white hover:bg-blue-50 border border-blue-200 shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200',
    }
  },
  honey: {
    name: 'Honey',
    description: 'Golden amber with warm glow',
    preview: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-amber-700',
      background: 'bg-amber-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-amber-200',
      hero: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white',
      section: 'bg-amber-50',
      card: 'bg-white hover:bg-amber-50 border border-amber-200 shadow-md hover:shadow-lg hover:shadow-amber-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-200',
    }
  },
  arctic: {
    name: 'Arctic',
    description: 'Cool ice blue with crisp whites',
    preview: 'bg-gradient-to-br from-blue-200 to-cyan-300',
    colors: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      accent: 'text-cyan-700',
      background: 'bg-cyan-50',
      card: 'bg-white',
    },
    styles: {
      header: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-cyan-200',
      hero: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500 text-white',
      section: 'bg-cyan-50',
      card: 'bg-white hover:bg-cyan-50 border border-cyan-200 shadow-md hover:shadow-lg hover:shadow-cyan-100 transition-all duration-300',
      button: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200',
    }
  },
  monochrome: {
    name: 'Monochrome',
    description: 'Pure black and white contrast',
    preview: 'bg-gradient-to-br from-black to-zinc-900',
    colors: {
      primary: 'text-black',
      secondary: 'text-zinc-700',
      accent: 'text-black',
      background: 'bg-white',
      card: 'bg-zinc-50',
    },
    styles: {
      header: 'bg-white border-b-2 border-black',
      hero: 'bg-black text-white',
      section: 'bg-white',
      card: 'bg-white hover:bg-zinc-50 border-2 border-black transition-all duration-200',
      button: 'bg-black hover:bg-zinc-800 text-white border-2 border-black transition-all duration-200',
    }
  }
}

export type ThemeName = keyof typeof themes