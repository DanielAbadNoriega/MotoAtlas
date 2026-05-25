import { FormEvent, MouseEvent, useMemo, useState } from 'react';
import methodologyHeroImage from '../../../assets/hero-metodology.png';
import { useAuth } from '../../../features/auth';
import { createModelRequest } from '../../../services/modelRequestService';
import { BIKE_SEGMENTS, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import type { BikeSegment } from '../../../types/bike';
import './StaticInfoPages.scss';

type InfoCard = Readonly<{
  badge?: string;
  icon: string;
  meta?: readonly [string, string][];
  text: string;
  title: string;
}>;

type InfoSection = Readonly<{
  body: readonly string[];
  callout?: string;
  id: string;
  title: string;
}>;

type ArticlePageProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
  sections: readonly InfoSection[];
  notice?: string;
}>;

type FormState = Readonly<{
  brand: string;
  comment: string;
  contactEmail: string;
  market: string;
  model: string;
  officialUrl: string;
  segment: BikeSegment | '';
  year: string;
}>;

type FormErrors = Partial<Record<keyof Pick<FormState, 'brand' | 'contactEmail' | 'model' | 'officialUrl' | 'year'>, string>>;

type SourceOverviewCard = Readonly<{
  accent?: 'primary' | 'accent' | 'muted';
  badge: string;
  icon: string;
  text: string;
  title: string;
}>;

type DataCategoryItem = Readonly<{
  icon: string;
  text: string;
  title: string;
}>;

type ConfidenceTier = Readonly<{
  label: string;
  level: 'Alta' | 'Media' | 'Pendiente';
  text: string;
  title: string;
  verifications: number;
}>;

const dataSourceCards = [
  {
    badge: 'api',
    icon: 'api',
    title: 'API externa',
    text: 'Datos técnicos obtenidos mediante integraciones externas cuando existe clave y cobertura suficiente. No se asumen como fabricante salvo que esté documentado.',
    meta: [['confianza', 'variable'], ['uso', 'specs base']],
  },
  {
    badge: 'manual',
    icon: 'fact_check',
    title: 'Revisión manual',
    text: 'Contenido curado dentro de MotoAtlas: imágenes, descripciones, precios revisados y correcciones editoriales protegidas.',
    meta: [['confianza', 'alta'], ['protección', 'locks']],
  },
  {
    badge: 'estimated',
    icon: 'calculate',
    title: 'Estimaciones',
    text: 'Puntuaciones de uso, pros/contras o fiabilidad calculados o redactados como punto de partida hasta tener más señales reales.',
    meta: [['confianza', 'media'], ['visible', 'discreto']],
  },
  {
    badge: 'user',
    icon: 'groups',
    title: 'Comunidad',
    text: 'Reviews, ratings y comentarios enviados por usuarios. Solo se muestran públicamente tras moderación y estado approved.',
    meta: [['estado', 'approved'], ['origen', 'user']],
  },
  {
    badge: 'placeholder',
    icon: 'pending',
    title: 'Pendiente de confirmar',
    text: 'Dato incompleto o imagen técnica temporal. Nunca debe interpretarse como especificación confirmada.',
    meta: [['riesgo', 'alto'], ['acción', 'revisar']],
  },
] satisfies readonly InfoCard[];

const sourceOverviewCards = [
  {
    accent: 'accent',
    badge: 'Prioridad',
    icon: 'api',
    title: 'API',
    text: 'Integraciones externas normalizadas cuando existe clave, cobertura suficiente y validación estricta antes de entrar al catálogo.',
  },
  {
    accent: 'primary',
    badge: 'Curado',
    icon: 'edit_document',
    title: 'Manual',
    text: 'Imágenes locales, descripciones, precios revisados y correcciones editoriales protegidas con locks y fuentes manual/user.',
  },
  {
    badge: 'Calculado',
    icon: 'calculate',
    title: 'Estimado',
    text: 'Puntuaciones de uso, pros/contras y fiabilidad inicial tratadas como estimación hasta tener señales reales suficientes.',
  },
  {
    accent: 'accent',
    badge: 'Comunidad',
    icon: 'groups',
    title: 'User',
    text: 'Reviews, ratings y comentarios enviados por usuarios. Solo el contenido approved se muestra públicamente.',
  },
  {
    accent: 'muted',
    badge: 'Revisión',
    icon: 'hourglass_top',
    title: 'Pending',
    text: 'Datos incompletos o placeholders controlados. Se muestran como pendientes de confirmar, nunca como verdad técnica.',
  },
] satisfies readonly SourceOverviewCard[];

const dataArchitectureItems = [
  {
    icon: 'settings_input_component',
    title: 'Specs técnicas',
    text: 'Cilindrada, potencia, par, peso, altura de asiento, depósito y equipamiento base validados contra reglas estrictas.',
  },
  {
    icon: 'payments',
    title: 'Precio',
    text: 'Precio en euros con `price_source`. Si vale 0, se considera pendiente de confirmar y no se presenta como precio real.',
  },
  {
    icon: 'photo_camera',
    title: 'Imágenes',
    text: 'Imágenes locales optimizadas cuando existen. Si falta material real, se usa fallback técnico con overlay visible.',
  },
  {
    icon: 'analytics',
    title: 'Scores',
    text: 'Uso ciudad, viaje, offroad, pasajero, principiante, sport y diversión con procedencia `scores_source`.',
  },
  {
    icon: 'rate_review',
    title: 'Reviews',
    text: 'Opiniones de comunidad moderadas. Pending queda privado; approved alimenta comunidad y rankings.',
  },
  {
    icon: 'shield',
    title: 'Fiabilidad',
    text: 'Reportes comunes, número de señales y puntuación de fiabilidad. Si no hay base suficiente, se marca como estimado.',
  },
] satisfies readonly DataCategoryItem[];

const confidenceTiers = [
  {
    label: 'Mayor confianza',
    level: 'Alta',
    title: 'Dato revisado o protegido',
    text: 'Contenido manual, imagen local real, descripción curada o dato API validado sin degradar información existente.',
    verifications: 3,
  },
  {
    label: 'Confianza media',
    level: 'Media',
    title: 'Dato normalizado y coherente',
    text: 'Dato externo o estimado que pasa validación, pero puede necesitar contraste editorial antes de una decisión de compra.',
    verifications: 2,
  },
  {
    label: 'Revisión pendiente',
    level: 'Pendiente',
    title: 'Placeholder o señal incompleta',
    text: 'Precio 0, imagen fallback, fiabilidad sin reportes o campo editorial vacío. Se conserva, pero marcado para revisión.',
    verifications: 1,
  },
] satisfies readonly ConfidenceTier[];

const methodologySections = [
  {
    id: 'que-es',
    title: 'Qué es MotoAtlas',
    body: [
      'MotoAtlas es un registro técnico de motos, comparativas y comunidad. Su objetivo es ayudarte a entender una moto con contexto: ficha técnica, uso real, puntos fuertes, límites y opiniones moderadas.',
      'No sustituye a la documentación oficial del fabricante ni a la información de un concesionario. Es una herramienta de análisis y descubrimiento.',
    ],
  },
  {
    id: 'fichas',
    title: 'Cómo se construyen las fichas',
    body: [
      'Cada ficha combina datos técnicos, contenido manual, estimaciones controladas, imágenes y señales de comunidad cuando existen.',
      'Los campos de procedencia usan etiquetas internas: api, manual, estimated, user y placeholder. Estas etiquetas nos permiten proteger contenido curado y evitar que automatizaciones lo degraden.',
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews y moderación',
    body: [
      'Las reviews enviadas por usuarios nacen como pending. Solo las reviews approved se muestran públicamente en ficha, comunidad y rankings.',
      'El sistema contempla rejected y hidden para moderación futura. Una review refleja experiencia personal y no debe leerse como prueba técnica absoluta.',
    ],
  },
  {
    id: 'limitaciones',
    title: 'Limitaciones importantes',
    body: [
      'Las especificaciones pueden variar por país, año, versión, packs opcionales o actualizaciones del fabricante.',
      'Antes de comprar una moto, verifica siempre precio, potencia, peso, equipamiento y disponibilidad con fabricante o concesionario oficial.',
    ],
    callout: 'MotoAtlas prioriza transparencia sobre falsa precisión: si un dato es estimado o placeholder, debe tratarse como pendiente de revisión.',
  },
] satisfies readonly InfoSection[];

const privacySections = [
  {
    id: 'datos',
    title: 'Datos que podemos recoger',
    body: [
      'Actualmente MotoAtlas puede tratar datos básicos que envías voluntariamente, como alias, comentario de una review, valoración, estilo de conducción, kilómetros o meses de propiedad.',
      'También pueden existir datos técnicos mínimos del navegador necesarios para operar la aplicación, depurar errores y mantener seguridad.',
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews y alias',
    body: [
      'Las reviews se guardan con alias. Si una review queda aprobada, el alias y el contenido pueden mostrarse públicamente en la ficha o comunidad de la moto.',
      'No publiques datos personales sensibles dentro del comentario, pros o contras.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies y analítica',
    body: [
      'MotoAtlas puede usar almacenamiento local para funciones como conservar la cola del comparador.',
      'La analítica avanzada y las cuentas de usuario no forman parte del núcleo actual. Si se incorporan, esta política deberá actualizarse.',
    ],
  },
  {
    id: 'servicios',
    title: 'Servicios externos y conservación',
    body: [
      'La aplicación usa Supabase como backend para datos como motos y reviews. También puede usar hosting/CDN para servir la web e imágenes.',
      'Las reviews pendientes, aprobadas o rechazadas pueden conservarse para moderación, seguridad y trazabilidad editorial.',
    ],
  },
  {
    id: 'derechos',
    title: 'Derechos del usuario y cambios',
    body: [
      'Puedes solicitar revisión o eliminación de contenido que hayas enviado cuando exista un canal de contacto operativo.',
      'Esta política podrá actualizarse conforme MotoAtlas incorpore cuentas de usuario, analítica o nuevas funciones.',
    ],
    callout: 'Esta política es una base inicial seria, no asesoría legal definitiva. Debe revisarse antes de producción pública completa.',
  },
] satisfies readonly InfoSection[];

const termsSections = [
  {
    id: 'uso',
    title: 'Uso de MotoAtlas',
    body: [
      'MotoAtlas es una plataforma de consulta, comparación y comunidad sobre motos. Debe usarse de forma legal, respetuosa y sin intentar degradar el servicio.',
      'Queda prohibida la extracción automatizada masiva sin autorización expresa.',
    ],
  },
  {
    id: 'datos',
    title: 'Datos técnicos y limitaciones',
    body: [
      'Los datos técnicos son referenciales. Pueden variar por país, año, versión, accesorios, packs opcionales o cambios del fabricante.',
      'MotoAtlas ayuda a comparar, pero no sustituye la verificación oficial con fabricante o concesionario.',
    ],
  },
  {
    id: 'comparativas',
    title: 'Comparativas',
    body: [
      'Las comparativas muestran una lectura estructurada de specs, puntuaciones, pros, contras y señales de uso. No garantizan rendimiento real en carretera o circuito.',
      'El usuario debe interpretar los resultados como apoyo a la decisión, no como recomendación de compra cerrada.',
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews y contenido de usuarios',
    body: [
      'Las reviews reflejan experiencias personales. MotoAtlas puede moderar, rechazar u ocultar contenido ofensivo, falso, duplicado o fuera de contexto.',
      'Al enviar contenido, autorizas a MotoAtlas a mostrarlo dentro de la plataforma si supera la moderación.',
    ],
  },
  {
    id: 'solicitudes',
    title: 'Solicitudes, propiedad intelectual y responsabilidad',
    body: [
      'Las solicitudes de modelos ayudan a priorizar el catálogo, pero no garantizan incorporación ni plazo concreto.',
      'La marca MotoAtlas, estructura de datos, diseño y lógica de comparación pertenecen al proyecto. MotoAtlas no responde por decisiones de compra tomadas sin verificación oficial.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios en los términos',
    body: [
      'Estos términos podrán actualizarse conforme se añadan login, panel admin, artículos, analítica u otras funciones.',
    ],
  },
] satisfies readonly InfoSection[];

function SourceCards({ cards }: { cards: readonly InfoCard[] }) {
  return (
    <div className="static-info__cards">
      {cards.map((card) => (
        <article key={card.title}>
          {card.badge ? <small>{card.badge}</small> : null}
          <span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
          {card.meta ? (
            <dl>
              {card.meta.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SourceOverviewCards({ cards }: { cards: readonly SourceOverviewCard[] }) {
  return (
    <div className="static-info__source-grid">
      {cards.map((card) => (
        <article className={`static-info__source-card static-info__source-card--${card.accent ?? 'neutral'}`} key={card.title}>
          <span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span>
          <div>
            <h3>{card.title}</h3>
            <small>{card.badge}</small>
          </div>
          <p>{card.text}</p>
        </article>
      ))}
    </div>
  );
}

function DataArchitectureGrid({ items }: { items: readonly DataCategoryItem[] }) {
  return (
    <div className="static-info__architecture-grid">
      {items.map((item) => (
        <article key={item.title}>
          <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ConfidenceProtocol({ tiers }: { tiers: readonly ConfidenceTier[] }) {
  return (
    <div className="static-info__confidence-card">
      {tiers.map((tier) => (
        <article key={tier.title}>
          <span>{tier.label}</span>
          <div>
            <small>{tier.level}</small>
            <h3>{tier.title}</h3>
            <p>{tier.text}</p>
          </div>
          <div aria-label={`${tier.verifications} niveles de verificación`}>
            {Array.from({ length: tier.verifications }, (_, index) => (
              <span className="material-symbols-outlined" aria-hidden="true" key={index}>verified</span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function DataSourcesDetailedPage() {
  return (
    <main className="static-info static-info--sources" aria-labelledby="static-info-title">
      <section className="static-info__source-hero">
        <div className="static-info__source-hero-background" aria-hidden="true">
          <img src={methodologyHeroImage} alt="" />
          <span />
        </div>
        <div className="static-info__source-hero-content">
          <span>Data transparency</span>
          <h1 id="static-info-title">Sabe de dónde viene cada dato.</h1>
          <p>
            MotoAtlas combina fuentes técnicas, revisión manual, estimaciones controladas y comunidad para construir fichas útiles sin ocultar la procedencia.
          </p>
          <div aria-hidden="true">
            <span>Integridad editorial</span>
            <i />
            <span>Pipeline validado</span>
          </div>
        </div>
      </section>

      <section className="static-info__sources-section" aria-labelledby="source-intelligence-title">
        <div className="static-info__sources-heading">
          <h2 id="source-intelligence-title">Source Intelligence</h2>
          <i aria-hidden="true" />
        </div>
        <SourceOverviewCards cards={sourceOverviewCards} />
      </section>

      <section className="static-info__sources-section static-info__sources-section--architecture" aria-labelledby="data-architecture-title">
        <div className="static-info__sources-heading static-info__sources-heading--center">
          <h2 id="data-architecture-title">Data Architecture</h2>
          <p>Cómo clasificamos las señales que alimentan buscador, ficha, comparador, comunidad y rankings.</p>
        </div>
        <DataArchitectureGrid items={dataArchitectureItems} />
      </section>

      <section className="static-info__sources-section" aria-labelledby="confidence-protocol-title">
        <h2 className="static-info__confidence-title" id="confidence-protocol-title">Confidence Index Protocol</h2>
        <ConfidenceProtocol tiers={confidenceTiers} />
      </section>

      <section className="static-info__source-flow" aria-label="Datos pendientes y flujo comunitario">
        <article>
          <span>Protocol exclusion</span>
          <h2>¿Por qué un dato queda pendiente?</h2>
          <p>
            Algunos valores se marcan como pendientes cuando MotoAtlas aún no tiene confianza suficiente para tratarlos como hecho técnico.
            Preferimos transparencia antes que completar una ficha con falsa precisión.
          </p>
          <ul>
            <li>Precio nuevo sin confirmación editorial.</li>
            <li>Imagen real todavía no optimizada localmente.</li>
            <li>Fiabilidad sin reportes o señales suficientes.</li>
          </ul>
        </article>

        <article>
          <h2>Community Validation Loop</h2>
          <ol>
            <li><span>Submitted</span><p>Un usuario envía una review o dato de experiencia.</p></li>
            <li><span>Pending review</span><p>La señal queda pendiente de moderación y contraste.</p></li>
            <li><span>Approved</span><p>Solo lo aprobado se muestra públicamente.</p></li>
            <li><span>Public record</span><p>La señal alimenta comunidad, rankings y contexto del modelo.</p></li>
          </ol>
        </article>
      </section>

      <section className="static-info__source-disclaimer" aria-labelledby="source-disclaimer-title">
        <span className="material-symbols-outlined" aria-hidden="true">gavel</span>
        <h2 id="source-disclaimer-title">Aviso técnico</h2>
        <p>
          Las especificaciones pueden variar por mercado, año, versión, normativa o packs opcionales. Aunque MotoAtlas aplica validación estricta,
          verifica siempre la información con el fabricante o concesionario antes de comprar una moto.
        </p>
      </section>
    </main>
  );
}

function ArticlePage({ description, eyebrow, notice, sections, title, updatedLabel }: ArticlePageProps) {
  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="static-info static-info--article" aria-labelledby="static-info-title">
      <header className="static-info__article-hero">
        <div className="static-info__updated">
          <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
          <span>{updatedLabel}</span>
        </div>
        <span>{eyebrow}</span>
        <h1 id="static-info-title">{title}</h1>
        <p>{description}</p>
      </header>

      <div className="static-info__article-layout">
        <aside className="static-info__toc" aria-label={`Índice de ${title}`}>
          <h2>Índice</h2>
          <nav>
            {sections.map((section, index) => (
              <a
                href={`#${section.id}`}
                key={section.id}
                onClick={(event) => handleTocClick(event, section.id)}
              >
                {String(index + 1).padStart(2, '0')} · {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="static-info__article-body">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id}>
              <h2><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.callout ? <aside>{section.callout}</aside> : null}
            </section>
          ))}
          {notice ? <p className="static-info__legal-note">{notice}</p> : null}
        </article>
      </div>
    </main>
  );
}

function TechnicalLandingPage({
  cards,
  description,
  eyebrow,
  sections,
  title,
}: Readonly<{
  cards: readonly InfoCard[];
  description: string;
  eyebrow: string;
  sections: readonly InfoSection[];
  title: string;
}>) {
  return (
    <main className="static-info static-info--technical" aria-labelledby="static-info-title">
      <section className="static-info__hero">
        <div className="static-info__hero-background" aria-hidden="true">
          <img src={methodologyHeroImage} alt="" />
          <span />
        </div>
        <div className="static-info__hero-content">
          <span>{eyebrow}</span>
          <h1 id="static-info-title">{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="static-info__section" aria-labelledby="static-info-sources-title">
        <div className="static-info__section-heading">
          <h2 id="static-info-sources-title">Arquitectura de datos</h2>
          <p>Las señales se clasifican para que sepas qué está confirmado, estimado o pendiente.</p>
        </div>
        <SourceCards cards={cards} />
      </section>

      <section className="static-info__section static-info__section--timeline" aria-labelledby="static-info-process-title">
        <div className="static-info__section-heading">
          <h2 id="static-info-process-title">Proceso editorial</h2>
          <p>Del dato bruto a una ficha usable.</p>
        </div>
        <div className="static-info__process">
          {sections.map((section, index) => (
            <article key={section.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{section.title}</h3>
              <p>{section.body[0]}</p>
              {section.callout ? <small>{section.callout}</small> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function validateRequestModel(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.brand.trim()) errors.brand = 'La marca es obligatoria.';
  if (!form.model.trim()) errors.model = 'El modelo es obligatorio.';

  const parsedYear = Number(form.year);
  if (!form.year.trim()) {
    errors.year = 'El año es obligatorio.';
  } else if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
    errors.year = 'Introduce un año válido.';
  }

  if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
    errors.contactEmail = 'Introduce un email válido.';
  }

  if (form.officialUrl.trim()) {
    try {
      const officialUrl = new URL(form.officialUrl.trim());
      if (!['http:', 'https:'].includes(officialUrl.protocol)) {
        errors.officialUrl = 'Introduce una URL válida empezando por http:// o https://.';
      }
    } catch {
      errors.officialUrl = 'Introduce una URL válida empezando por http:// o https://.';
    }
  }

  return errors;
}

function buildRequestComment(form: FormState) {
  const market = form.market.trim();
  const comment = form.comment.trim();

  return [market ? `Mercado: ${market}` : '', comment].filter(Boolean).join('\n\n');
}

export function DataMethodologyPage() {
  return (
    <TechnicalLandingPage
      eyebrow="Data methodology"
      title="Datos técnicos con contexto."
      description="Cómo MotoAtlas combina especificaciones, contenido manual, estimaciones y comunidad sin ocultar la procedencia de cada dato."
      cards={dataSourceCards}
      sections={methodologySections}
    />
  );
}

export function DataSourcesPage() {
  return <DataSourcesDetailedPage />;
}

export function PrivacyPage() {
  return (
    <ArticlePage
      eyebrow="Legal"
      title="Privacidad"
      description="Cómo tratamos datos, reviews, alias y actividad básica dentro de MotoAtlas."
      updatedLabel="Base inicial · mayo 2026"
      sections={privacySections}
      notice="Esta política podrá actualizarse conforme MotoAtlas incorpore cuentas de usuario, analítica o nuevas funciones."
    />
  );
}

export function TermsPage() {
  return (
    <ArticlePage
      eyebrow="Legal"
      title="Términos de uso"
      description="Condiciones básicas para utilizar MotoAtlas, sus datos técnicos, comparativas y comunidad."
      updatedLabel="Base inicial · mayo 2026"
      sections={termsSections}
      notice="Estos términos son una base inicial y deberán revisarse antes de una publicación comercial completa."
    />
  );
}

export function RequestModelPage() {
  const { isAuthenticated, session, user, profile } = useAuth();
  const [form, setForm] = useState<FormState>({
    brand: '',
    comment: '',
    contactEmail: '',
    market: '',
    model: '',
    officialUrl: '',
    segment: '',
    year: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serviceError, setServiceError] = useState('');

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isSubmitting = requestStatus === 'submitting';
  const authContext = isAuthenticated && user?.id && session?.access_token
    ? {
        accessToken: session.access_token,
        userId: user.id,
        userName: profile?.displayName || undefined,
      }
    : undefined;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestStatus('idle');
    setServiceError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRequestModel(form);
    setErrors(nextErrors);
    setServiceError('');

    if (Object.keys(nextErrors).length > 0) {
      setRequestStatus('idle');
      return;
    }

    setRequestStatus('submitting');

    try {
      await createModelRequest(
        {
          brand: form.brand,
          model: form.model,
          year: Number(form.year),
          segment: form.segment || null,
          contactEmail: form.contactEmail,
          officialUrl: form.officialUrl,
          comment: buildRequestComment(form),
        },
        authContext,
      );
      setRequestStatus('success');
    } catch (error) {
      setRequestStatus('error');
      setServiceError(error instanceof Error ? error.message : 'No se ha podido enviar la solicitud.');
    }
  };

  return (
    <main className="static-info static-info--request" aria-labelledby="request-model-title">
      <section className="static-info__request-hero">
        <div>
          <span>Community contribution</span>
          <h1 id="request-model-title">¿Falta una moto?</h1>
          <p>Solicita un modelo y ayuda a MotoAtlas a ampliar el catálogo técnico. Revisaremos la solicitud antes de incorporarla.</p>
          <small>
            {authContext
              ? 'Esta solicitud quedará asociada a tu cuenta.'
              : 'Puedes enviarla sin iniciar sesión, aunque si accedes a tu cuenta podremos asociarla a tu perfil.'}
          </small>
        </div>

        <form className="static-info__request-form" onSubmit={handleSubmit} noValidate aria-label="Formulario para solicitar modelo">
          <div className="static-info__form-grid static-info__form-grid--two">
            <label htmlFor="request-brand">
              Marca
              <input
                id="request-brand"
                name="brand"
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                placeholder="Ej. Ducati"
                aria-invalid={errors.brand ? 'true' : undefined}
                aria-describedby={errors.brand ? 'request-brand-error' : undefined}
              />
              {errors.brand ? <span id="request-brand-error">{errors.brand}</span> : null}
            </label>
            <label htmlFor="request-model">
              Modelo
              <input
                id="request-model"
                name="model"
                value={form.model}
                onChange={(event) => updateField('model', event.target.value)}
                placeholder="Ej. Panigale V4 R"
                aria-invalid={errors.model ? 'true' : undefined}
                aria-describedby={errors.model ? 'request-model-error' : undefined}
              />
              {errors.model ? <span id="request-model-error">{errors.model}</span> : null}
            </label>
          </div>

          <div className="static-info__form-grid static-info__form-grid--three">
            <label htmlFor="request-year">
              Año
              <input
                id="request-year"
                name="year"
                value={form.year}
                onChange={(event) => updateField('year', event.target.value)}
                placeholder="Ej. 2026"
                inputMode="numeric"
                aria-invalid={errors.year ? 'true' : undefined}
                aria-describedby={errors.year ? 'request-year-error' : undefined}
              />
              {errors.year ? <span id="request-year-error">{errors.year}</span> : null}
            </label>
            <label htmlFor="request-segment">
              Segmento
              <select
                id="request-segment"
                name="segment"
                value={form.segment}
                onChange={(event) => updateField('segment', event.target.value)}
              >
                <option value="">Selecciona segmento</option>
                {BIKE_SEGMENTS.map((segment) => <option value={segment} key={segment}>{segmentLabels[segment]}</option>)}
              </select>
            </label>
            <label htmlFor="request-market">
              País / mercado opcional
              <input
                id="request-market"
                name="market"
                value={form.market}
                onChange={(event) => updateField('market', event.target.value)}
                placeholder="Ej. España / UE"
              />
            </label>
          </div>

          {!authContext ? (
            <label htmlFor="request-contact-email">
              Email de contacto opcional
              <input
                id="request-contact-email"
                name="contact_email"
                type="email"
                value={form.contactEmail}
                onChange={(event) => updateField('contactEmail', event.target.value)}
                placeholder="tu@email.com"
                aria-invalid={errors.contactEmail ? 'true' : undefined}
                aria-describedby={errors.contactEmail ? 'request-contact-email-error' : undefined}
              />
              {errors.contactEmail ? <span id="request-contact-email-error">{errors.contactEmail}</span> : null}
            </label>
          ) : null}

          <label htmlFor="request-official-url">
            Página oficial o fuente
            <input
              id="request-official-url"
              name="official_url"
              type="url"
              value={form.officialUrl}
              onChange={(event) => updateField('officialUrl', event.target.value)}
              placeholder="https://..."
              aria-invalid={errors.officialUrl ? 'true' : undefined}
              aria-describedby={errors.officialUrl ? 'request-official-url-helper request-official-url-error' : 'request-official-url-helper'}
            />
            <small id="request-official-url-helper">Opcional. Nos ayuda a verificar los datos del modelo.</small>
            {errors.officialUrl ? <span id="request-official-url-error">{errors.officialUrl}</span> : null}
          </label>

          <label htmlFor="request-comment">
            Comentario opcional
            <textarea
              id="request-comment"
              name="comment"
              value={form.comment}
              onChange={(event) => updateField('comment', event.target.value)}
              placeholder="Versión concreta, uso previsto o por qué deberíamos priorizarla..."
              rows={4}
            />
          </label>

          {hasErrors ? <p className="static-info__form-alert" role="alert">Revisa los campos obligatorios antes de enviar.</p> : null}
          {requestStatus === 'error' ? (
            <p className="static-info__form-alert" role="alert">{serviceError || 'No se ha podido enviar la solicitud.'}</p>
          ) : null}
          {requestStatus === 'success' ? (
            <p className="static-info__form-success" role="status">
              Solicitud enviada. Revisaremos el modelo antes de incorporarlo al catálogo.
            </p>
          ) : null}

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </section>
    </main>
  );
}
