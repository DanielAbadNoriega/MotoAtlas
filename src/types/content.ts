export type AnchorHref = `#${string}`;

export type MaterialIconName =
  | 'account_circle'
  | 'arrow_forward'
  | 'brand_awareness'
  | 'check_circle'
  | 'fact_check'
  | 'language'
  | 'menu'
  | 'photo_camera'
  | 'play_circle'
  | 'public'
  | 'search'
  | 'share'
  | 'warning';

export type BrandContent = Readonly<{
  name: string;
  homeHref: AnchorHref;
  homeAriaLabel: string;
}>;

export type NavLink = Readonly<{
  label: string;
  href: AnchorHref;
}>;

export type NavActionContent = Readonly<{
  signInLabel: string;
  searchLabel: string;
  menuLabel: string;
  profileLabel: string;
}>;


export type SiteA11yContent = Readonly<{
  mainNavigationLabel: string;
}>;

export type FooterLink = Readonly<{
  label: string;
  href: AnchorHref;
}>;

export type FooterColumn = Readonly<{
  title: string;
  links: readonly FooterLink[];
}>;

export type FooterSocialAction = Readonly<{
  label: string;
  href: `https://${string}`;
  icon: Extract<MaterialIconName, 'brand_awareness' | 'photo_camera' | 'play_circle' | 'public'>;
}>;

export type FooterContent = Readonly<{
  ariaLabel: string;
  brandDescription: string;
  copyright: string;
  columns: readonly FooterColumn[];
  socialActions: readonly FooterSocialAction[];
}>;

export type HeroSearchContent = Readonly<{
  label: string;
  placeholder: string;
  submitLabel: string;
}>;

export type HeroContent = Readonly<{
  title: string;
  search: HeroSearchContent;
}>;

export type SectionHeaderContent = Readonly<{
  kicker?: string;
  title: string;
  description?: string;
  actionLabel?: string;
}>;

export type MachineDuelContent = Readonly<{
  header: SectionHeaderContent;
  versusLabel: string;
  actionLabel: string;
}>;

export type ReportCtaContent = Readonly<{
  title: string;
  actionLabel: string;
}>;

export type CardActionContent = Readonly<{
  compareLabel: string;
}>;
