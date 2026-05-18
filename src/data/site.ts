import type {
  BrandContent,
  FooterContent,
  NavActionContent,
  NavLink,
  SiteA11yContent,
} from '../types/content';

export const brand = {
  name: 'MotoAtlas',
  homeHref: '#/',
  homeAriaLabel: 'Ir al inicio de MotoAtlas',
} satisfies BrandContent;

export const navLinks = [
  { label: 'Buscador', href: '#/buscador' },
  { label: 'Comparador', href: '#/comparador' },
  { label: 'Noticias', href: '#/noticias' },
  { label: 'Comunidad', href: '#/comunidad' },
] satisfies readonly NavLink[];

export const siteA11y = {
  mainNavigationLabel: 'Navegación principal',
} satisfies SiteA11yContent;

export const navActions = {
  signInLabel: 'Iniciar sesión',
  searchLabel: 'Buscar en MotoAtlas',
  menuLabel: 'Abrir menú',
  profileLabel: 'Abrir perfil',
} satisfies NavActionContent;

export const footerContent = {
  ariaLabel: 'Pie de página de MotoAtlas',
  brandDescription: 'Registro técnico de motos, comparativas y comunidad.',
  copyright: '© 2026 MotoAtlas. Todos los derechos reservados.',
  columns: [
    {
      title: 'Explorar',
      links: [
        { label: 'Buscador', href: '#/buscador' },
        { label: 'Comparador', href: '#/comparador' },
        { label: 'Comunidad', href: '#/comunidad' },
      ],
    },
    {
      title: 'Datos',
      links: [
        { label: 'Metodología', href: '#/metodologia' },
        { label: 'Fuentes de datos', href: '#/fuentes-datos' },
        { label: 'Solicitar modelo', href: '#/solicitar-modelo' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacidad', href: '#/privacidad' },
        { label: 'Términos', href: '#/terminos' },
      ],
    },
  ],
  socialActions: [
    { label: 'TikTok', href: 'https://www.tiktok.com/', icon: 'brand_awareness' },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: 'photo_camera' },
    { label: 'YouTube', href: 'https://www.youtube.com/', icon: 'play_circle' },
    { label: 'Facebook', href: 'https://www.facebook.com/', icon: 'public' },
  ],
} satisfies FooterContent;
