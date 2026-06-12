import fs from 'fs/promises'
import path from 'path'

type Motorcycle = {
  id: string
  brand?: string
  model?: string
  segment?: string
  license?: string
  engineType?: string
  displacementCc?: number
  powerHp?: number
  pros?: readonly string[]
  cons?: readonly string[]
  description?: string
}

type Review = {
  motorcycle_id: string
  user_name: string
  rating: number
  ownership_months: number
  kilometers: number
  comment: string
  pros: string[]
  cons: string[]
  riding_style: string
  status: string
  verified: boolean
  source?: string
}

type ReviewTone = 'positive' | 'balanced' | 'critical'
type VisualStressProfile = 'short' | 'medium' | 'long'

type TextProfile = {
  intros: string[]
  highlights: string[]
  drawbacks: string[]
  ownership: string[]
  closers: Record<ReviewTone, string[]>
}

const RIDING_STYLES = ['touring', 'offroad', 'daily', 'passenger', 'city', 'sport'] as const
const ALLOWED_RIDING_STYLES = ['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario']

const ALIASES = [
  'TrailHunter',
  'BoxerRider',
  'CurvasYPuños',
  'RutaLibre',
  'KilometroCero',
  'AceleradorFeliz',
  'PataCorta',
  'DobleEmbrague',
  'MotoMecanica',
  'VientoYRuta',
  'AsfaltoYBarro',
  'CascoRojo',
  'GasYSiesta',
  'TwinRider',
  'ViajeSinMapa',
]

const GENERIC_PROS = [
  'Motor con buena respuesta desde abajo',
  'Consumo razonable para el uso real',
  'Postura cómoda para varias horas seguidas',
  'Entrega de potencia fácil de dosificar',
  'Acabados sólidos para su rango de precio',
  'Electrónica suficiente sin complicar la experiencia',
  'Buen equilibrio entre diversión y uso práctico',
  'Transmite confianza desde los primeros kilómetros',
]

const GENERIC_CONS = [
  'Protección aerodinámica justa a ritmo alto',
  'Asiento duro al pasar varias horas seguidas',
  'Peso perceptible en maniobras en parado',
  'Suspensión de serie mejorable si vas rápido',
  'El precio final sube rápido con extras',
  'Calor del motor notable en verano',
  'La pantalla/instrumentación puede distraer más de la cuenta',
  'No es la más amable para tallas bajas',
]

const STYLE_PROFILES: Record<string, TextProfile> = {
  touring: {
    intros: [
      'La compré pensando en escapadas largas y terminó haciendo bastante más que eso.',
      'La mayor parte de mis kilómetros son de ruta y autopista, así que la probé en el terreno que más importa.',
      'Mi uso es claramente viajero, con equipaje y jornadas largas casi todos los meses.',
    ],
    highlights: [
      'A ritmo legal va descansada y deja viajar sin pelearte con el viento.',
      'La autonomía y el par en medios ayudan mucho cuando vas cargado.',
      'En carretera rápida se siente estable y transmite bastante aplomo.',
      'Con maletas y pasajero no se viene abajo tanto como esperaba.',
    ],
    drawbacks: [
      'La pantalla de serie protege menos de lo que promete.',
      'Cuando la llenás de equipaje, las maniobras lentas requieren atención.',
      'Si el asfalto se rompe mucho, la suspensión deja claro su límite antes que el motor.',
      'En ciudad se nota más grande de lo deseable para filtrar entre autos.',
    ],
    ownership: [
      'En viajes de fin de semana se volvió fácil de recomendar.',
      'Para salir temprano, hacer tirada larga y volver entero cumple muy bien.',
      'Es de esas motos que te invitan a sumar kilómetros sin mirar demasiado el reloj.',
    ],
    closers: {
      positive: [
        'Para viajar con frecuencia me dejó muy conforme y repetiría compra.',
        'Si tu prioridad es hacer kilómetros con comodidad, tiene mucho sentido.',
      ],
      balanced: [
        'La volvería a elegir solo si asumís que algunos detalles hay que afinarlos a tu gusto.',
        'No es perfecta, pero como rutera polivalente cumple bastante bien.',
      ],
      critical: [
        'Para el precio que tiene esperaba más refinamiento en uso viajero.',
        'Terminé adaptándome, pero no me terminó de convencer para ruta larga.',
      ],
    },
  },
  offroad: {
    intros: [
      'La uso mucho en pista y caminos rotos, que es donde realmente se le ven las costuras.',
      'Mi referencia es el uso mixto con bastante tierra, no solo una foto linda con neumáticos de tacos.',
      'Entró al garaje para hacer aventura real y ya tuvo suficiente barro como para opinar con criterio.',
    ],
    highlights: [
      'De pie se deja llevar bien y no obliga a pelearte con la ergonomía.',
      'En pistas rápidas transmite control y permite levantar el ritmo con confianza.',
      'El motor tracciona bien abajo y ayuda a salir de zonas lentas sin castigar el embrague.',
      'Tiene un punto de nobleza que se agradece cuando el terreno se complica.',
    ],
    drawbacks: [
      'Con neumático de serie se queda corta si de verdad buscás agarre en terreno roto.',
      'El peso aparece enseguida cuando te equivocás de línea o toca levantarla.',
      'Protecciones y cubrecárter merecen upgrade si vas a hacer offroad en serio.',
      'En asfalto va bien, pero la puesta a punto deja claro que su terreno favorito es otro.',
    ],
    ownership: [
      'Después de varios caminos feos, quedó claro que la base es buena pero pide alguna mejora lógica.',
      'Para aventura de verdad da más confianza que muchas trail de postureo.',
      'Es una moto que se disfruta más cuanto más la sacás del asfalto.',
    ],
    closers: {
      positive: [
        'Como base para viajar y meter tierra en serio, me parece muy convincente.',
        'Si querés una trail para usarla de verdad, tiene argumentos sólidos.',
      ],
      balanced: [
        'Sirve para aventura real, pero conviene entrar sabiendo qué cosas vas a tocar primero.',
        'Cumple, aunque no reemplaza preparación si sos exigente fuera del asfalto.',
      ],
      critical: [
        'Para el tipo de offroad que hago se me quedó corta más veces de las deseables.',
        'No me terminó de cerrar como moto de aventura cuando la exigís de verdad.',
      ],
    },
  },
  daily: {
    intros: [
      'La uso casi todos los días para ir y volver del trabajo, así que la conozco más en rutina que en paseo.',
      'Mi uso es muy diario, con tráfico, recados y algún tramo de circunvalación.',
      'Se ganó su lugar a base de uso cotidiano, no de salidas esporádicas.',
    ],
    highlights: [
      'Entre autos se mueve mejor de lo que sugieren sus números en ficha.',
      'El embrague y la respuesta a baja velocidad hacen la vida fácil en tráfico lento.',
      'Consume poco para el ritmo real de ciudad y eso se nota al final del mes.',
      'En arranques y paradas continuas no se vuelve cansadora tan rápido.',
    ],
    drawbacks: [
      'Cuando aprieta el calor del verano, el motor se hace notar bastante.',
      'El radio de giro no ayuda tanto como me gustaría para maniobrar en espacios chicos.',
      'La suspensión seca algunos baches más de la cuenta en calles rotas.',
      'En autopista corta protege lo justo y nada más.',
    ],
    ownership: [
      'En el día a día terminó siendo más práctica de lo que esperaba.',
      'Para convivir con ella a diario tiene más sentido que muchas opciones más vistosas.',
      'Es fácil de usar sin que por eso resulte aburrida.',
    ],
    closers: {
      positive: [
        'Como compañera diaria me parece una compra muy lógica.',
        'Para quien necesita una moto utilizable todos los días, deja buena impresión.',
      ],
      balanced: [
        'Me resulta útil, aunque no deja de tener concesiones típicas de este segmento.',
        'Cumple bien a diario, pero no me enamora en todos los apartados.',
      ],
      critical: [
        'Para uso diario esperaba una convivencia bastante más amable.',
        'Se puede usar a diario, pero no la volvería a comprar para ese plan.',
      ],
    },
  },
  passenger: {
    intros: [
      'La mitad de las salidas las hago con pasajero, así que ese fue el filtro principal.',
      'No opino solo por el puesto del piloto: en casa importa mucho cómo viaja la segunda plaza.',
      'La elegimos pensando en rutas a dúo y eso cambia bastante la vara.',
    ],
    highlights: [
      'La plaza trasera es más aprovechable de lo habitual y eso suma muchos puntos.',
      'Con dos arriba mantiene compostura y el motor no se siente forzado.',
      'La postura general permite viajar en pareja sin que todo termine en quejas.',
      'La entrega de par ayuda mucho al salir de curvas o adelantamientos con carga.',
    ],
    drawbacks: [
      'El asiento del acompañante podría tener mejor mullido para jornadas largas.',
      'Con maletas y pasajero las maniobras en parado requieren más cabeza que fuerza.',
      'La suspensión trasera pide ajuste si viajás seguido a dúo.',
      'La protección aerodinámica del acompañante es bastante justa de serie.',
    ],
    ownership: [
      'Para viajar de a dos quedó mejor parada de lo que esperaba.',
      'No es una GT pura, pero como moto para compartir funciona bastante bien.',
      'En pareja se disfruta más cuando la ruta se alarga.',
    ],
    closers: {
      positive: [
        'Si salís mucho con acompañante, está por encima de la media en sensaciones reales.',
        'Como moto para disfrutar de a dos, deja una impresión muy buena.',
      ],
      balanced: [
        'Para uso con pasajero cumple, aunque tiene detalles que conviene revisar antes de un gran viaje.',
        'Sirve para viajar de a dos, pero no todo está tan resuelto como parece.',
      ],
      critical: [
        'Para viajar con pasajero esperaba bastante más confort y refinamiento.',
        'No me terminó de convencer como moto pensada para hacer kilómetros en pareja.',
      ],
    },
  },
  city: {
    intros: [
      'La mayor parte del tiempo rueda entre semáforos, calles estrechas y frenadas constantes.',
      'La mido mucho por cómo se comporta en ciudad, porque ahí pasa la mayor parte de su vida.',
      'Mi uso es más urbano que otra cosa, con trayectos cortos y tráfico real.',
    ],
    highlights: [
      'Es fácil de colocar en el carril y no se siente torpe entre autos.',
      'La respuesta a baja velocidad es predecible y ayuda a moverse con soltura.',
      'Tiene un punto de practicidad que se agradece cuando la usás para todo.',
      'A ritmo urbano no castiga ni al cuerpo ni al bolsillo tanto como otras rivales.',
    ],
    drawbacks: [
      'El calor en piernas aparece rápido cuando el tráfico se pone pesado.',
      'El asiento no es el más amable si enlazás muchos trayectos en el mismo día.',
      'En resaltos y tapas mal puestas la suspensión puede rebotar más de la cuenta.',
      'La visibilidad trasera o los espejos podrían estar mejor resueltos.',
    ],
    ownership: [
      'Para la ciudad real, con baches y apuro, terminó resultando bastante coherente.',
      'Convive bien con el uso urbano y no da pereza sacarla todos los días.',
      'Es de esas motos que en ciudad hacen casi todo fácil sin dejar de tener carácter.',
    ],
    closers: {
      positive: [
        'Como moto urbana con algo de personalidad, me dejó muy buen sabor de boca.',
        'Si buscás algo usable en ciudad sin que sea anodino, tiene bastante sentido.',
      ],
      balanced: [
        'Para ciudad cumple bien, pero no todo está tan pulido como me gustaría.',
        'La usaría de nuevo en entorno urbano, aunque sabiendo ya sus límites.',
      ],
      critical: [
        'En ciudad esperaba una experiencia bastante más redonda y menos cansadora.',
        'Para moverme a diario por urbano no terminó siendo la aliada que buscaba.',
      ],
    },
  },
  sport: {
    intros: [
      'La compré para divertirme en curvas y ahí es donde más la juzgo.',
      'Mi uso es claramente deportivo de carretera, más por sensaciones que por cifras en una ficha.',
      'No la elegí por practicidad sino por cómo transmite cuando el ritmo sube.',
    ],
    highlights: [
      'En cambios de dirección se siente viva y bastante conectada con lo que hacés.',
      'Frenos y apoyo delantero permiten entrar con confianza cuando apurás el paso.',
      'El motor pide jugar con él y recompensa cuando lo llevás en la zona buena.',
      'Tiene ese punto de carácter que hace que una ruta de curvas valga el desvío.',
    ],
    drawbacks: [
      'En ciudad o trayectos largos el confort cae más rápido de lo tolerable.',
      'La protección aerodinámica y la postura pasan factura si haces mucha autopista.',
      'A bajo régimen puede sentirse algo brusca comparada con opciones más dóciles.',
      'La suspensión seca el piso roto cuando el asfalto deja de acompañar.',
    ],
    ownership: [
      'Cuando salís a buscar curvas te recuerda rápido por qué te gustó en primer lugar.',
      'No es la más racional, pero sí una de las que más sonrisa saca cuando la ruta acompaña.',
      'Tiene más sentido desde el casco puesto que mirando solo la hoja técnica.',
    ],
    closers: {
      positive: [
        'Si priorizás sensaciones sobre practicidad, cuesta bajarse sin una sonrisa.',
        'Como moto para disfrutar la conducción, me dejó muy conforme.',
      ],
      balanced: [
        'Divierte, aunque hay que aceptar las concesiones fuera de su terreno ideal.',
        'No es para todo el mundo, pero entendiendo su enfoque cumple bien.',
      ],
      critical: [
        'Esperaba más precisión y menos compromisos para un uso deportivo real.',
        'No me terminó de cerrar cuando la comparé con lo que promete sobre el papel.',
      ],
    },
  },
}

const SEGMENT_PROFILES: Record<string, { pros: string[]; cons: string[] }> = {
  trail: {
    pros: ['Buen equilibrio entre carretera y pistas', 'Ergonomía cómoda para viajar y levantarse de pie', 'Versatilidad real para hacer de todo'],
    cons: ['Altura que impone respeto en parado', 'Si la cargás mucho el peso se hace notar', 'De serie siempre pide algún accesorio para aventura'],
  },
  adventure: {
    pros: ['Autonomía útil para viajes largos', 'Posición natural para enlazar horas de ruta', 'Buena base para equipaje y uso mixto'],
    cons: ['Con todos los extras se dispara de precio', 'La anchura se nota en ciudad', 'No siempre es tan ágil como aparenta'],
  },
  touring: {
    pros: ['Protección y confort por encima de la media', 'Viaja bien con carga y pasajero', 'Motor relajado a cruceros altos'],
    cons: ['Peso alto al maniobrar', 'En ciudad es aparatosa', 'Algunas soluciones de equipaje podrían estar mejor resueltas'],
  },
  'sport-touring': {
    pros: ['Buen compromiso entre comodidad y ritmo alegre', 'Motor con empuje utilizable en carretera', 'Sirve tanto para ruta como para escapadas rápidas'],
    cons: ['No llega al confort de una touring pura', 'Si apurás el ritmo pide suspensiones finas', 'La protección no siempre está al nivel del motor'],
  },
  naked: {
    pros: ['Motor lleno y divertido', 'Sensación directa al conducir', 'Mantenimiento relativamente sencillo'],
    cons: ['Poca protección al viento', 'Asiento justo para muchos kilómetros', 'En autopista cansa antes de lo ideal'],
  },
  sport: {
    pros: ['Parte ciclo comunicativa', 'Frenos convincentes cuando sube el ritmo', 'Buena precisión en carretera de curvas'],
    cons: ['Postura exigente fuera de su terreno', 'Confort escaso para uso diario', 'El calor y la dureza aparecen rápido'],
  },
  supersport: {
    pros: ['Precisión de chasis muy seria', 'Sensaciones fuertes cuando la llevás arriba', 'Frenada y apoyo delantero destacados'],
    cons: ['Ergonomía dura para calle', 'Motor poco amable abajo', 'Uso real muy condicionado por postura y calor'],
  },
  hypernaked: {
    pros: ['Aceleración contundente', 'Electrónica que ayuda a domesticarla', 'Mucho carácter en cada salida'],
    cons: ['Exceso de potencia para usarla tranquila', 'Aerodinámica mínima', 'Gasta más y exige cabeza con el gas'],
  },
  enduro: {
    pros: ['Muy noble fuera del asfalto', 'Peso contenido para lo que ofrece', 'Permite aprender y mejorar en tierra'],
    cons: ['Enlace por carretera menos agradable', 'Asiento y mantenimiento más sacrificados', 'Protección casi inexistente'],
  },
  'dual-sport': {
    pros: ['Sencilla y honesta para uso mixto', 'Muy aprovechable en caminos', 'Costes contenidos'],
    cons: ['Limitada para viajar rápido', 'Acabados sencillos', 'Con pasajero o carga se queda justa antes'],
  },
  scrambler: {
    pros: ['Estilo con personalidad', 'Postura relajada y agradable', 'Uso diario simpático y fácil'],
    cons: ['La estética a veces pesa más que la función', 'Protección muy justa', 'Capacidad rutera limitada de serie'],
  },
  custom: {
    pros: ['Motor con entrega tranquila y agradable', 'Postura relajada', 'Mucho carisma a baja velocidad'],
    cons: ['Poco ángulo para enlazar curvas rápidas', 'Suspensión seca en asfalto roto', 'Menos práctica de lo que su imagen sugiere'],
  },
  cruiser: {
    pros: ['Confort y aplomo a ritmo relajado', 'Gran presencia y tacto de motor', 'Buena para paseos largos sin apuro'],
    cons: ['Peso elevado en maniobras', 'Frena y gira con menos margen que otras propuestas', 'No es amiga del tráfico denso'],
  },
  retro: {
    pros: ['Acabado y estética con mucho encanto', 'Conducción sencilla y agradable', 'Buen equilibrio entre imagen y uso real'],
    cons: ['Parte ciclo más conservadora', 'Ergonomía y protección limitadas para viajar', 'Pagás parte del encanto en el precio'],
  },
  'neo-retro': {
    pros: ['Diseño cuidado sin renunciar a tecnología útil', 'Motor con mucha personalidad', 'Uso real más fácil de lo que parece'],
    cons: ['Protección aerodinámica casi nula', 'Suspensiones mejorables según versión', 'No suele ser barata para lo que ofrece'],
  },
  scooter: {
    pros: ['Practicidad total en ciudad', 'Hueco y protección útiles en uso diario', 'Muy fácil de convivir'],
    cons: ['Sensaciones limitadas si buscás conducción pasional', 'En baches o asfalto roto se notan sus límites', 'A ritmo alto pierde parte de su gracia'],
  },
}

function normalizeRidingStyle(style: string): string {
  const s = String(style).toLowerCase()
  switch (s) {
    case 'touring':
      return 'viaje'
    case 'commuting':
    case 'daily':
      return 'diario'
    case 'sport':
      return 'deportivo'
    case 'city':
      return 'ciudad'
    case 'passenger':
      return 'pasajero'
    case 'offroad':
      return 'offroad'
    default:
      return 'ciudad'
  }
}

function seededRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)]
}

function uniquePick<T>(rng: () => number, arr: T[], count: number): T[] {
  const pool = [...arr]
  const out: T[] = []
  while (pool.length && out.length < count) {
    const index = Math.floor(rng() * pool.length)
    out.push(pool.splice(index, 1)[0])
  }
  return out
}

function weightedChoice<T>(rng: () => number, items: Array<[T, number]>) {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [it, w] of items) {
    if (r < w) return it
    r -= w
  }
  return items[items.length - 1][0]
}

function getReviewTone(rating: number): ReviewTone {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'balanced'
  return 'critical'
}

function getVisualStressProfile(rng: () => number): VisualStressProfile {
  return weightedChoice(rng, [
    ['short', 24],
    ['medium', 51],
    ['long', 25],
  ])
}

function getSegmentProfile(segment?: string) {
  return SEGMENT_PROFILES[segment ?? ''] ?? { pros: [], cons: [] }
}

function formatKilometers(kilometers: number) {
  return `${new Intl.NumberFormat('es-ES').format(kilometers)} km`
}

function getMotorcycleLabel(motorcycle: Motorcycle) {
  const brand = motorcycle.brand?.trim()
  const model = motorcycle.model?.trim()
  if (brand && model) return `${brand} ${model}`
  return model || brand || 'la moto'
}

function sanitizeTextArray(items: readonly string[] | undefined, fallback: string[]) {
  const cleaned = (items ?? [])
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0 && !/^(null|undefined)$/i.test(item))

  return cleaned.length ? cleaned : fallback
}

function trimSentenceFragment(text: string) {
  return text.trim().replace(/[.!?]+$/u, '')
}

function buildMockPros(
  rng: () => number,
  motorcycle: Motorcycle,
  tone: ReviewTone,
  profile: VisualStressProfile,
  ridingStyleRaw: string,
) {
  const segmentProfile = getSegmentProfile(motorcycle.segment)
  const pool = [
    ...sanitizeTextArray(motorcycle.pros, GENERIC_PROS),
    ...segmentProfile.pros,
    ...STYLE_PROFILES[ridingStyleRaw].highlights,
    ...STYLE_PROFILES[ridingStyleRaw].ownership,
  ]

  const uniquePool = Array.from(new Set(pool))
  const desiredCount =
    tone === 'positive'
      ? weightedChoice(rng, profile === 'long' ? [[2, 20], [3, 55], [4, 25]] : [[1, 20], [2, 55], [3, 25]])
      : tone === 'balanced'
        ? weightedChoice(rng, [[1, 30], [2, 50], [3, 20]])
        : weightedChoice(rng, [[1, 55], [2, 35], [3, 10]])

  return uniquePick(rng, uniquePool, desiredCount)
}

function buildMockCons(
  rng: () => number,
  motorcycle: Motorcycle,
  tone: ReviewTone,
  profile: VisualStressProfile,
  ridingStyleRaw: string,
) {
  const segmentProfile = getSegmentProfile(motorcycle.segment)
  const pool = [
    ...sanitizeTextArray(motorcycle.cons, GENERIC_CONS),
    ...segmentProfile.cons,
    ...STYLE_PROFILES[ridingStyleRaw].drawbacks,
  ]

  const uniquePool = Array.from(new Set(pool))
  const desiredCount =
    tone === 'positive'
      ? weightedChoice(rng, profile === 'short' ? [[1, 80], [2, 20]] : [[1, 55], [2, 35], [3, 10]])
      : tone === 'balanced'
        ? weightedChoice(rng, [[1, 20], [2, 45], [3, 35]])
        : weightedChoice(rng, profile === 'long' ? [[2, 25], [3, 45], [4, 30]] : [[1, 20], [2, 50], [3, 30]])

  return uniquePick(rng, uniquePool, desiredCount)
}

function buildMockComment(
  rng: () => number,
  motorcycle: Motorcycle,
  ridingStyleRaw: string,
  rating: number,
  ownershipMonths: number,
  kilometers: number,
  profile: VisualStressProfile,
) {
  const tone = getReviewTone(rating)
  const styleProfile = STYLE_PROFILES[ridingStyleRaw]
  const motorcycleLabel = getMotorcycleLabel(motorcycle)
  const intro = pick(rng, styleProfile.intros)
  const highlight = pick(rng, styleProfile.highlights)
  const drawback = pick(rng, styleProfile.drawbacks)
  const ownershipNote = pick(rng, styleProfile.ownership)
  const closer = pick(rng, styleProfile.closers[tone])

  const experience = [
    `La ${motorcycleLabel} la tengo hace ${ownershipMonths} meses y ya suma ${formatKilometers(kilometers)}.`,
    `En este tiempo con la ${motorcycleLabel} ya le hice ${formatKilometers(kilometers)} y se nota dónde destaca y dónde no.`,
    `Después de ${ownershipMonths} meses con la ${motorcycleLabel}, el uso real ya me dejó bastante claro sus puntos fuertes y sus límites.`,
  ]

  const nuancePositive = [
    'No me parece una moto perfecta, pero sí una de esas que te facilitan convivir con ella.',
    'Se siente más redonda en uso real de lo que parecen decir algunos números de catálogo.',
    'Lo que más valoro es que transmite confianza incluso cuando la jornada se alarga.',
  ]

  const nuanceBalanced = [
    'Tiene cosas muy buenas, aunque convive con un par de concesiones claras.',
    'Me gusta, pero no diría que encaja igual de bien con cualquier tipo de uso.',
    'No decepciona, aunque tampoco tapa del todo sus compromisos cuando la exigís.',
  ]

  const nuanceCritical = [
    'Esperaba una experiencia más redonda para el uso que realmente le doy.',
    'No me salió mala, pero tampoco me generó esa confianza que te hace defender una compra.',
    'Hay virtudes, aunque en mi caso los compromisos terminaron pesando más de la cuenta.',
  ]

  const toneNuance =
    tone === 'positive'
      ? pick(rng, nuancePositive)
      : tone === 'balanced'
        ? pick(rng, nuanceBalanced)
        : pick(rng, nuanceCritical)

  const mileageSentence = pick(rng, experience)
  const downsideFragment = trimSentenceFragment(`${drawback.charAt(0).toLowerCase()}${drawback.slice(1)}`)
  const positiveFragment = trimSentenceFragment(`${highlight.charAt(0).toLowerCase()}${highlight.slice(1)}`)
  const downsideSentence = `Lo que menos me convenció es que ${downsideFragment}.`
  const positiveSentence = `Lo mejor, para mi uso, es que ${positiveFragment}.`

  if (profile === 'short') {
    const conciseMileage = `Llevo ${ownershipMonths} meses y ${formatKilometers(kilometers)}.`
    const conciseHighlight = pick(rng, [
      `Me gusta porque ${highlight.charAt(0).toLowerCase()}${highlight.slice(1)}`,
      `La uso sobre todo para ${ridingStyleRaw === 'daily' ? 'el día a día' : ridingStyleRaw === 'touring' ? 'salidas largas' : ridingStyleRaw === 'offroad' ? 'pistas y caminos' : ridingStyleRaw === 'passenger' ? 'salir con pasajero' : ridingStyleRaw === 'sport' ? 'carretera de curvas' : 'ciudad'} y ahí cumple bien.`,
    ])

    return [conciseMileage, conciseHighlight].join(' ')
  }

  if (profile === 'medium') {
    return [intro, positiveSentence, downsideSentence].join(' ')
  }

  return [
    intro,
    mileageSentence,
    positiveSentence,
    toneNuance,
    downsideSentence,
    ownershipNote,
    closer,
  ].join(' ')
}

function createRating(rng: () => number, ridingStyleRaw: string, segment?: string) {
  const styleWeights: Record<string, Array<[number, number]>> = {
    touring: [[5, 28], [4, 38], [3, 22], [2, 9], [1, 3]],
    offroad: [[5, 23], [4, 34], [3, 25], [2, 13], [1, 5]],
    daily: [[5, 18], [4, 37], [3, 29], [2, 12], [1, 4]],
    passenger: [[5, 21], [4, 34], [3, 25], [2, 15], [1, 5]],
    city: [[5, 19], [4, 36], [3, 28], [2, 13], [1, 4]],
    sport: [[5, 26], [4, 33], [3, 23], [2, 13], [1, 5]],
  }

  const segmentBias = segment === 'scooter' ? 0.05 : segment === 'supersport' ? -0.02 : 0
  const roll = rng() + segmentBias
  const weights = styleWeights[ridingStyleRaw] ?? styleWeights.city
  if (roll < 0.08) return 1
  return weightedChoice(rng, weights)
}

export async function generateMockReviews(opts?: {
  count?: number
  seed?: number
  motorcycles?: Motorcycle[]
}): Promise<Review[]> {
  const count = opts?.count ?? 120
  const seed = opts?.seed ?? Date.now()
  const rng = seededRandom(seed)
  const motorcycles = opts?.motorcycles ?? (await loadMotorcycles())
  if (!motorcycles.length) return []

  const bikeIds = motorcycles.map((m) => m.id)
  const motorcyclesById = new Map(motorcycles.map((m) => [m.id, m]))
  const hotspotCount = Math.min(bikeIds.length, Math.max(3, Math.floor(bikeIds.length * 0.08)))
  const hotspots: Set<string> = new Set()
  while (hotspots.size < hotspotCount) hotspots.add(pick(rng, bikeIds))

  const reviews: Review[] = []

  for (let i = 0; i < count; i++) {
    const isHot = rng() < 0.45
    const motorcycle_id = isHot ? pick(rng, Array.from(hotspots)) : pick(rng, bikeIds)
    const motorcycle = motorcyclesById.get(motorcycle_id) ?? { id: motorcycle_id }

    const riding_style_raw = pick(rng, [...RIDING_STYLES])
    const riding_style = normalizeRidingStyle(riding_style_raw)

    const ownership_months = Math.max(1, Math.round(1 + rng() * 96))
    const avgMonthly: Record<string, number> = {
      touring: 1900,
      offroad: 520,
      daily: 950,
      passenger: 820,
      city: 620,
      sport: 760,
    }
    const avg = avgMonthly[riding_style_raw] ?? 700
    const kilometers = Math.max(120, Math.round(ownership_months * (avg * (0.65 + rng() * 1.2))))

    const rating = createRating(rng, riding_style_raw, motorcycle.segment)
    const tone = getReviewTone(rating)
    const profile = getVisualStressProfile(rng)

    const verified = rng() < 0.16
    const status = weightedChoice(rng, [
      ['approved', 84],
      ['pending', 12],
      ['rejected', 4],
    ])

    const user_name = pick(rng, ALIASES) + (rng() < 0.28 ? Math.floor(rng() * 900) : '')
    const pros = buildMockPros(rng, motorcycle, tone, profile, riding_style_raw)
    const cons = buildMockCons(rng, motorcycle, tone, profile, riding_style_raw)
    const comment = buildMockComment(rng, motorcycle, riding_style_raw, rating, ownership_months, kilometers, profile)

    reviews.push({
      motorcycle_id,
      user_name,
      rating,
      ownership_months,
      kilometers,
      comment,
      pros,
      cons,
      riding_style,
      status,
      verified,
      source: 'mock',
    })
  }

  return reviews
}

async function loadMotorcycles(): Promise<Motorcycle[]> {
  const p = path.join(process.cwd(), 'data', 'import', 'motorcycles.json')
  try {
    const raw = await fs.readFile(p, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed.map((m: any) => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      segment: m.segment,
      license: m.license,
      engineType: m.engineType,
      displacementCc: m.displacementCc,
      powerHp: m.powerHp,
      pros: m.pros,
      cons: m.cons,
      description: m.description,
    }))
  } catch (e) {
    return []
  }
}

function signature(r: Review) {
  return `${r.motorcycle_id}|||${r.user_name}|||${r.comment.slice(0, 120)}`
}

async function writeMockFile(reviews: Review[], reset = false) {
  const dir = path.join(process.cwd(), 'data', 'mock')
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, 'mockReviews.json')
  if (reset) {
    await fs.writeFile(file, JSON.stringify(reviews, null, 2), 'utf8')
    return { written: reviews.length, merged: 0 }
  }

  let existing: Review[] = []
  try {
    const raw = await fs.readFile(file, 'utf8')
    existing = JSON.parse(raw)
  } catch (e) {
    existing = []
  }

  const seen = new Set(existing.map(signature))
  const toAdd = reviews.filter((r) => !seen.has(signature(r)))
  const merged = existing.concat(toAdd)
  await fs.writeFile(file, JSON.stringify(merged, null, 2), 'utf8')
  return { written: toAdd.length, merged: merged.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ;(async () => {
    const args = process.argv.slice(2)
    const reset = args.includes('--reset')
    const cArg = args.find((a) => a.startsWith('--count='))
    const count = cArg ? parseInt(cArg.split('=')[1], 10) : undefined
    const seedArg = args.find((a) => a.startsWith('--seed='))
    const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : undefined

    const motorcycles = await loadMotorcycles()
    const reviews = await generateMockReviews({ count: count ?? 120, seed, motorcycles })
    const res = await writeMockFile(reviews, reset)
    console.log(`Generated ${reviews.length} mock reviews. Written: ${res.written}. Total in file: ${res.merged}`)
  })()
}

export default generateMockReviews
