/**
 * Dashboard Themes — 12 templates visuales
 */

export const THEMES = {

  // ── ORIGINALES ────────────────────────────────────────────────────────────

  midnight: {
    id: 'midnight', name: 'Midnight', description: 'Dark & professional',
    preview: ['#6366F1','#10B981','#F59E0B','#EF4444'],
    vars: {
      '--t-bg':'#07091A','--t-surface':'#0E1225','--t-elevated':'#161B30','--t-overlay':'#1E2540',
      '--t-border':'rgba(255,255,255,0.06)','--t-accent':'#6366F1','--t-accent2':'#10B981',
      '--t-text-1':'#F0F2FF','--t-text-2':'#8B92B8','--t-text-3':'#454E72','--t-radius':'14px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(255,255,255,0.04)',
      labelColor:'#8B92B8',tooltipBg:'#1E2540',tooltipBorder:'rgba(255,255,255,0.08)',
      tooltipColor:'#F0F2FF',titleColor:'#F0F2FF',
      colors:['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899'],
    },
  },

  arctic: {
    id: 'arctic', name: 'Arctic', description: 'Clean light mode',
    preview: ['#3B82F6','#06B6D4','#8B5CF6','#F59E0B'],
    vars: {
      '--t-bg':'#F0F4FF','--t-surface':'#FFFFFF','--t-elevated':'#F8FAFF','--t-overlay':'#EEF2FF',
      '--t-border':'rgba(59,130,246,0.12)','--t-accent':'#3B82F6','--t-accent2':'#06B6D4',
      '--t-text-1':'#0F172A','--t-text-2':'#475569','--t-text-3':'#94A3B8','--t-radius':'12px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(0,0,0,0.06)',
      labelColor:'#64748B',tooltipBg:'#1E293B',tooltipBorder:'rgba(0,0,0,0.1)',
      tooltipColor:'#F8FAFC',titleColor:'#0F172A',
      colors:['#3B82F6','#06B6D4','#8B5CF6','#F59E0B','#10B981','#EF4444','#F97316','#EC4899'],
    },
  },

  forest: {
    id: 'forest', name: 'Forest', description: 'Natural & earthy',
    preview: ['#10B981','#059669','#34D399','#6EE7B7'],
    vars: {
      '--t-bg':'#0A1A12','--t-surface':'#0F2318','--t-elevated':'#163120','--t-overlay':'#1E4029',
      '--t-border':'rgba(16,185,129,0.12)','--t-accent':'#10B981','--t-accent2':'#34D399',
      '--t-text-1':'#ECFDF5','--t-text-2':'#6EE7B7','--t-text-3':'#2D6A4F','--t-radius':'10px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(16,185,129,0.08)',
      labelColor:'#6EE7B7',tooltipBg:'#1E4029',tooltipBorder:'rgba(16,185,129,0.2)',
      tooltipColor:'#ECFDF5',titleColor:'#ECFDF5',
      colors:['#10B981','#34D399','#6EE7B7','#059669','#F59E0B','#3B82F6','#A78BFA','#F97316'],
    },
  },

  sunset: {
    id: 'sunset', name: 'Sunset', description: 'Warm & energetic',
    preview: ['#F97316','#EF4444','#F59E0B','#EC4899'],
    vars: {
      '--t-bg':'#1A0A00','--t-surface':'#1F1008','--t-elevated':'#2A1810','--t-overlay':'#3D2218',
      '--t-border':'rgba(249,115,22,0.12)','--t-accent':'#F97316','--t-accent2':'#EF4444',
      '--t-text-1':'#FFF7ED','--t-text-2':'#FDBA74','--t-text-3':'#7C3A12','--t-radius':'16px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(249,115,22,0.08)',
      labelColor:'#FDBA74',tooltipBg:'#3D2218',tooltipBorder:'rgba(249,115,22,0.2)',
      tooltipColor:'#FFF7ED',titleColor:'#FFF7ED',
      colors:['#F97316','#EF4444','#F59E0B','#EC4899','#FB923C','#FCD34D','#FDA4AF','#C2410C'],
    },
  },

  galaxy: {
    id: 'galaxy', name: 'Galaxy', description: 'Purple & cosmic',
    preview: ['#8B5CF6','#A78BFA','#EC4899','#06B6D4'],
    vars: {
      '--t-bg':'#0D0618','--t-surface':'#130922','--t-elevated':'#1C1030','--t-overlay':'#271840',
      '--t-border':'rgba(139,92,246,0.12)','--t-accent':'#8B5CF6','--t-accent2':'#EC4899',
      '--t-text-1':'#FAF5FF','--t-text-2':'#C4B5FD','--t-text-3':'#5B3F8A','--t-radius':'18px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(139,92,246,0.08)',
      labelColor:'#C4B5FD',tooltipBg:'#271840',tooltipBorder:'rgba(139,92,246,0.25)',
      tooltipColor:'#FAF5FF',titleColor:'#FAF5FF',
      colors:['#8B5CF6','#EC4899','#06B6D4','#A78BFA','#F472B6','#34D399','#F59E0B','#60A5FA'],
    },
  },

  corporate: {
    id: 'corporate', name: 'Corporate', description: 'Formal & minimal',
    preview: ['#1D4ED8','#374151','#6B7280','#D1D5DB'],
    vars: {
      '--t-bg':'#F9FAFB','--t-surface':'#FFFFFF','--t-elevated':'#F3F4F6','--t-overlay':'#E5E7EB',
      '--t-border':'rgba(0,0,0,0.08)','--t-accent':'#1D4ED8','--t-accent2':'#1E40AF',
      '--t-text-1':'#111827','--t-text-2':'#374151','--t-text-3':'#9CA3AF','--t-radius':'8px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(0,0,0,0.05)',
      labelColor:'#6B7280',tooltipBg:'#111827',tooltipBorder:'rgba(0,0,0,0.15)',
      tooltipColor:'#F9FAFB',titleColor:'#111827',
      colors:['#1D4ED8','#374151','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316'],
    },
  },

  // ── NUEVOS ────────────────────────────────────────────────────────────────

  cyber: {
    id: 'cyber', name: 'Neon Cyber', description: 'Cyan & magenta. Tecnología',
    preview: ['#00F5FF','#FF00AA','#0066FF','#AA00FF'],
    vars: {
      '--t-bg':'#05091A','--t-surface':'#080E28','--t-elevated':'#0C1535','--t-overlay':'#101D45',
      '--t-border':'rgba(0,245,255,0.1)','--t-accent':'#00F5FF','--t-accent2':'#FF00AA',
      '--t-text-1':'#E0FAFF','--t-text-2':'#7ECFDB','--t-text-3':'#2A5A6A','--t-radius':'6px',
      '--t-font':'monospace',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(0,245,255,0.06)',
      labelColor:'#7ECFDB',tooltipBg:'#0C1535',tooltipBorder:'rgba(0,245,255,0.2)',
      tooltipColor:'#E0FAFF',titleColor:'#00F5FF',
      colors:['#00F5FF','#FF00AA','#0066FF','#AA00FF','#00FF88','#FFD700','#FF4466','#00CCFF'],
    },
  },

  gold: {
    id: 'gold', name: 'Executive Gold', description: 'Dorado sobre negro. Finanzas',
    preview: ['#D4A017','#F0C040','#B8860B','#FFD700'],
    vars: {
      '--t-bg':'#0E0B00','--t-surface':'#1A1208','--t-elevated':'#241900','--t-overlay':'#302200',
      '--t-border':'rgba(212,160,23,0.15)','--t-accent':'#D4A017','--t-accent2':'#F0C040',
      '--t-text-1':'#FFF8E1','--t-text-2':'#D4A017','--t-text-3':'#6B4F00','--t-radius':'8px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(212,160,23,0.08)',
      labelColor:'#A07800',tooltipBg:'#241900',tooltipBorder:'rgba(212,160,23,0.3)',
      tooltipColor:'#FFF8E1',titleColor:'#F0C040',
      colors:['#D4A017','#F0C040','#B8860B','#FFD700','#C68B2A','#E6B800','#8B6914','#FFC107'],
    },
  },

  minimal: {
    id: 'minimal', name: 'Pure Minimal', description: 'Blanco + negro. Editorial',
    preview: ['#111111','#444444','#888888','#CCCCCC'],
    vars: {
      '--t-bg':'#FFFFFF','--t-surface':'#FFFFFF','--t-elevated':'#F5F5F5','--t-overlay':'#EBEBEB',
      '--t-border':'rgba(0,0,0,0.1)','--t-accent':'#111111','--t-accent2':'#555555',
      '--t-text-1':'#0A0A0A','--t-text-2':'#333333','--t-text-3':'#999999','--t-radius':'4px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(0,0,0,0.06)',
      labelColor:'#888888',tooltipBg:'#111111',tooltipBorder:'rgba(0,0,0,0.2)',
      tooltipColor:'#FFFFFF',titleColor:'#0A0A0A',
      colors:['#111111','#555555','#888888','#AAAAAA','#333333','#666666','#999999','#CCCCCC'],
    },
  },

  gradient: {
    id: 'gradient', name: 'Gradient Mesh', description: 'Violeta a rosa. Moderno',
    preview: ['#667EEA','#764BA2','#F093FB','#A78BFA'],
    vars: {
      '--t-bg':'#1A1040','--t-surface':'rgba(255,255,255,0.07)','--t-elevated':'rgba(255,255,255,0.1)',
      '--t-overlay':'rgba(255,255,255,0.14)',
      '--t-border':'rgba(255,255,255,0.15)','--t-accent':'#A78BFA','--t-accent2':'#F093FB',
      '--t-text-1':'#FFFFFF','--t-text-2':'rgba(255,255,255,0.75)','--t-text-3':'rgba(255,255,255,0.4)',
      '--t-radius':'16px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(255,255,255,0.1)',
      labelColor:'rgba(255,255,255,0.6)',tooltipBg:'rgba(26,16,64,0.95)',
      tooltipBorder:'rgba(255,255,255,0.2)',tooltipColor:'#FFFFFF',titleColor:'#FFFFFF',
      colors:['#A78BFA','#F093FB','#667EEA','#34D399','#F59E0B','#60A5FA','#F472B6','#4ADE80'],
    },
  },

  terminal: {
    id: 'terminal', name: 'Terminal', description: 'Verde matrix. Ops & Dev',
    preview: ['#00FF41','#00CC33','#008822','#003311'],
    vars: {
      '--t-bg':'#0A0A0A','--t-surface':'#0D0D0D','--t-elevated':'#111111','--t-overlay':'#161616',
      '--t-border':'rgba(0,255,65,0.15)','--t-accent':'#00FF41','--t-accent2':'#00CC33',
      '--t-text-1':'#00FF41','--t-text-2':'#00AA2B','--t-text-3':'#005515','--t-radius':'2px',
      '--t-font':'monospace',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(0,255,65,0.07)',
      labelColor:'#00AA2B',tooltipBg:'#0D0D0D',tooltipBorder:'rgba(0,255,65,0.3)',
      tooltipColor:'#00FF41',titleColor:'#00FF41',
      colors:['#00FF41','#00CC33','#00FF88','#66FF77','#00AA2B','#33FF66','#008822','#44FF55'],
    },
  },

  ocean: {
    id: 'ocean', name: 'Ocean Glass', description: 'Azul profundo + glass. Premium',
    preview: ['#64FFDA','#4ECDC4','#0F3460','#16213E'],
    vars: {
      '--t-bg':'#060D1F','--t-surface':'rgba(255,255,255,0.05)','--t-elevated':'rgba(255,255,255,0.08)',
      '--t-overlay':'rgba(255,255,255,0.12)',
      '--t-border':'rgba(100,255,218,0.15)','--t-accent':'#64FFDA','--t-accent2':'#4ECDC4',
      '--t-text-1':'#FFFFFF','--t-text-2':'rgba(255,255,255,0.7)','--t-text-3':'rgba(255,255,255,0.35)',
      '--t-radius':'12px',
    },
    highcharts: {
      bgColor:'transparent',plotBgColor:'transparent',gridColor:'rgba(100,255,218,0.08)',
      labelColor:'rgba(255,255,255,0.5)',tooltipBg:'rgba(6,13,31,0.95)',
      tooltipBorder:'rgba(100,255,218,0.2)',tooltipColor:'#FFFFFF',titleColor:'#64FFDA',
      colors:['#64FFDA','#4ECDC4','#45B7D1','#FF6B6B','#F7DC6F','#A29BFE','#FD79A8','#55EFC4'],
    },
  },

}

export const DEFAULT_THEME_ID = 'midnight'

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID]
}

export function applyThemeVars(themeId, element) {
  const theme = getTheme(themeId)
  Object.entries(theme.vars).forEach(([k, v]) => element.style.setProperty(k, v))
}
