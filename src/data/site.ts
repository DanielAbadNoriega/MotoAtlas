import type {
  BrandContent,
  FooterContent,
  NavActionContent,
  NavLink,
  SiteA11yContent,
} from '../types/content';

export const brand = {
  name: 'MotoAtlas',
  homeHref: '#top',
  homeAriaLabel: 'Ir al inicio de MotoAtlas',
} satisfies BrandContent;

export const navLinks = [
  { label: 'Buscador', href: '#/buscador' },
  { label: 'Comparativas', href: '#comparativas' },
  { label: 'Noticias', href: '#noticias' },
  { label: 'Rutas', href: '#rutas' },
  { label: 'Comunidad', href: '#comunidad' },
] satisfies readonly NavLink[];

export const siteA11y = {
  mainNavigationLabel: 'Navegación principal',
} satisfies SiteA11yContent;

export const navActions = {
  signInLabel: 'Ingresar',
  searchLabel: 'Buscar en MotoAtlas',
  menuLabel: 'Abrir menú',
  profileLabel: 'Abrir perfil',
} satisfies NavActionContent;

export const footerContent = {
  ariaLabel: 'Comunidad MotoAtlas',
  secondaryNavLabel: 'Enlaces secundarios',
  socialLabel: 'Acciones sociales',
  copyright: '© 2026 MotoAtlas. Registro de ingeniería de alto rendimiento.',
  links: [
    { label: 'Privacidad', href: '#top' },
    { label: 'Términos', href: '#top' },
    { label: 'Especificaciones técnicas', href: '#top' },
    { label: 'Soporte', href: '#top' },
  ],
  socialActions: [
    { label: 'Cambiar idioma', icon: 'language' },
    { label: 'Compartir MotoAtlas', icon: 'share' },
  ],
} satisfies FooterContent;
