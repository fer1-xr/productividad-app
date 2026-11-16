export type Theme = 'light' | 'dark' | 'system'
export const THEME_STORAGE_KEY = 'theme'

/** Se ejecuta antes de pintar para evitar el parpadeo del tema. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`
