export const motorcycleTechnicalIconMap = {
  engine: 'settings_input_component',
  power: 'bolt',
  torque: 'settings',
  weight: 'weight',
  seatHeight: 'height',
  fuelTank: 'oil_barrel',
  license: 'workspace_premium',
  price: 'payments',

  ergonomics: 'bike_lane',
  consumption: 'local_gas_station',
  braking: 'adjust',
  suspension: 'vibration',
  electronics: 'memory',
  aerodynamics: 'air',
  passenger: 'group',
  maintenance: 'build',
  design: 'palette',
} as const;

export type MotorcycleTechnicalIconKey = keyof typeof motorcycleTechnicalIconMap;

export function getMotorcycleTechnicalIcon(key: MotorcycleTechnicalIconKey): string {
  return motorcycleTechnicalIconMap[key];
}