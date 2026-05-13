import bmwS1000rr from '../assets/featured/BMW S1000RR.png';
import ducatiPanigale from '../assets/featured/Ducati Panigale.png';
import yamahaR1 from '../assets/featured/Yamaha R1.png';
import cbr1000rr from '../assets/comparison/cbr1000rr(Comparison Bike A).png';
import kawasakiZx10rr from '../assets/comparison/kawasaki-zx-10rr(Comparison Bike B).png';
import type { Bike, ComparisonBike } from '../types/bike';

export const featuredBikes: Bike[] = [
  {
    id: 'bmw-s1000rr',
    name: 'BMW S1000RR',
    category: 'SUPERBIKE',
    image: bmwS1000rr,
    alt: 'BMW S1000RR en estudio oscuro con detalles mecánicos iluminados.',
    specs: [
      { label: 'CILINDRADA', value: '999 CC' },
      { label: 'POTENCIA', value: '205 HP' },
    ],
  },
  {
    id: 'ducati-panigale-v4',
    name: 'Panigale V4',
    category: 'EXÓTICA',
    image: ducatiPanigale,
    alt: 'Ducati Panigale V4 roja en garaje minimalista con iluminación técnica.',
    specs: [
      { label: 'CILINDRADA', value: '1.103 CC' },
      { label: 'POTENCIA', value: '210 HP' },
    ],
  },
  {
    id: 'yamaha-yzf-r1',
    name: 'Yamaha YZF-R1',
    category: 'CIRCUITO',
    image: yamahaR1,
    alt: 'Yamaha R1 frontal en showroom tecnológico oscuro.',
    specs: [
      { label: 'CILINDRADA', value: '998 CC' },
      { label: 'POTENCIA', value: '200 HP' },
    ],
  },
];

export const duelBikes: ComparisonBike[] = [
  {
    id: 'honda-cbr1000rr-r',
    name: 'Honda CBR1000RR-R',
    subtitle: 'Fireblade SP',
    image: cbr1000rr,
    alt: 'Honda CBR1000RR-R en perfil técnico para comparativa.',
    accent: 'red',
    specs: [
      { label: 'Peso lleno', value: '201 kg' },
      { label: 'Torque', value: '113 Nm' },
      { label: 'Electrónica', value: 'Bosch 6-axis' },
    ],
  },
  {
    id: 'kawasaki-zx-10rr',
    name: 'Kawasaki ZX-10RR',
    subtitle: 'Ninja Performance',
    image: kawasakiZx10rr,
    alt: 'Kawasaki Ninja ZX-10RR en perfil técnico monocromo.',
    accent: 'neutral',
    specs: [
      { label: 'Peso lleno', value: '207 kg' },
      { label: 'Torque', value: '111,8 Nm' },
      { label: 'Electrónica', value: 'KCMF Suite' },
    ],
  },
];
