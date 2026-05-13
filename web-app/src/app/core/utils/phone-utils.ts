export interface InfoPais {
  iso: string;
  codigo: string;
}

export const INFO_PAIS: Record<string, InfoPais> = {
  'Peruana':        { iso: 'PE', codigo: '+51' },
  'Argentina':      { iso: 'AR', codigo: '+54' },
  'Boliviana':      { iso: 'BO', codigo: '+591' },
  'Brasileña':      { iso: 'BR', codigo: '+55' },
  'Canadiense':     { iso: 'CA', codigo: '+1' },
  'Chilena':        { iso: 'CL', codigo: '+56' },
  'Colombiana':     { iso: 'CO', codigo: '+57' },
  'Costarricense':  { iso: 'CR', codigo: '+506' },
  'Cubana':         { iso: 'CU', codigo: '+53' },
  'Dominicana':     { iso: 'DO', codigo: '+1' },
  'Ecuatoriana':    { iso: 'EC', codigo: '+593' },
  'Estadounidense': { iso: 'US', codigo: '+1' },
  'Francesa':       { iso: 'FR', codigo: '+33' },
  'Guatemalteca':   { iso: 'GT', codigo: '+502' },
  'Haitiana':       { iso: 'HT', codigo: '+509' },
  'Hondureña':      { iso: 'HN', codigo: '+504' },
  'Italiana':       { iso: 'IT', codigo: '+39' },
  'Japonesa':       { iso: 'JP', codigo: '+81' },
  'Mexicana':       { iso: 'MX', codigo: '+52' },
  'Nicaragüense':   { iso: 'NI', codigo: '+505' },
  'Panameña':       { iso: 'PA', codigo: '+507' },
  'Paraguaya':      { iso: 'PY', codigo: '+595' },
  'Portuguesa':     { iso: 'PT', codigo: '+351' },
  'Puertorriqueña': { iso: 'PR', codigo: '+1' },
  'Salvadoreña':    { iso: 'SV', codigo: '+503' },
  'Española':       { iso: 'ES', codigo: '+34' },
  'Uruguaya':       { iso: 'UY', codigo: '+598' },
  'Venezolana':     { iso: 'VE', codigo: '+58' },
  'Alemana':        { iso: 'DE', codigo: '+49' },
  'Británica':      { iso: 'GB', codigo: '+44' },
  'China':          { iso: 'CN', codigo: '+86' },
  'Coreana':        { iso: 'KR', codigo: '+82' },
  'India':          { iso: 'IN', codigo: '+91' },
  'Rusa':           { iso: 'RU', codigo: '+7' },
  'Sudafricana':    { iso: 'ZA', codigo: '+27' },
};

export function infoPorNacionalidad(nacionalidad: string): InfoPais | undefined {
  return INFO_PAIS[nacionalidad];
}
