import { FormEvent, useMemo, useState } from 'react';
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
  market: string;
  model: string;
  segment: BikeSegment | '';
  year: string;
}>;

type FormErrors = Partial<Record<keyof Pick<FormState, 'brand' | 'model' | 'year'>, string>>;

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

const dataSourcesSections = [
  {
    id: 'externas',
    title: 'Fuentes externas/API',
    body: [
      'MotoAtlas puede enriquecer datos desde APIs externas cuando existe cobertura. Esas respuestas se normalizan y validan antes de entrar en el catálogo.',
      'No se nombran proveedores concretos ni se afirma origen fabricante si no está documentado dentro del proyecto.',
    ],
  },
  {
    id: 'manual',
    title: 'Revisión manual y datos curados',
    body: [
      'Las imágenes locales, descripciones editoriales, precios revisados y correcciones manuales tienen prioridad frente a datos automáticos.',
      'Los locks y las fuentes manual/user evitan que una importación futura sobrescriba contenido bueno por placeholders.',
    ],
  },
  {
    id: 'comunidad',
    title: 'Datos de comunidad y ratings',
    body: [
      'Los ratings y reviews proceden de usuarios y se muestran únicamente cuando están approved.',
      'Las opiniones de comunidad se separan de las especificaciones técnicas: una cosa es la ficha, otra la experiencia real de propietarios.',
    ],
  },
  {
    id: 'transparencia',
    title: 'Transparencia y verificación',
    body: [
      'Los datos pueden contener errores o estar pendientes de revisión. Antes de comprar una moto, verifica siempre la información con el fabricante o concesionario.',
      'Las imágenes pueden ser manuales, externas o placeholder técnico si falta material real optimizado.',
    ],
    callout: 'Fuente técnica no equivale a opinión de usuario. MotoAtlas separa procedencia, confianza y uso visual de cada dato.',
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

function ArticlePage({ description, eyebrow, notice, sections, title, updatedLabel }: ArticlePageProps) {
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
              <a href={`#${section.id}`} key={section.id}>{String(index + 1).padStart(2, '0')} · {section.title}</a>
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
        <div>
          <span>{eyebrow}</span>
          <h1 id="static-info-title">{title}</h1>
          <p>{description}</p>
          <a className="button button--primary" href="#/buscador">Explorar motos</a>
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

  return errors;
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
  return (
    <TechnicalLandingPage
      eyebrow="Fuentes de datos"
      title="Transparencia antes que falsa precisión."
      description="De dónde pueden venir los datos de MotoAtlas, cómo se clasifican y qué debe verificarse antes de tomar una decisión de compra."
      cards={dataSourceCards.slice(0, 4)}
      sections={dataSourcesSections}
    />
  );
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
  const [form, setForm] = useState<FormState>({ brand: '', comment: '', market: '', model: '', segment: '', year: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setIsSubmitted(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRequestModel(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setIsSubmitted(false);
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <main className="static-info static-info--request" aria-labelledby="request-model-title">
      <section className="static-info__request-hero">
        <div>
          <span>Community contribution</span>
          <h1 id="request-model-title">¿Falta una moto?</h1>
          <p>Solicita un modelo y ayuda a MotoAtlas a ampliar el catálogo técnico. La conexión real con backend queda pendiente.</p>
          <small>Las solicitudes se asociarán a cuentas de MotoAtlas en una fase futura.</small>
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
          {isSubmitted ? (
            <p className="static-info__form-success" role="status">
              Solicitud recibida. Revisaremos este modelo antes de añadirlo al catálogo.
            </p>
          ) : null}

          <button className="button button--primary" type="submit">Enviar solicitud</button>
        </form>
      </section>
    </main>
  );
}
