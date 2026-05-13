export type CategoriaEdad = 'nino' | 'adolescente' | 'adulto' | 'adulto_mayor';

export function clasificarEdad(fechaNacimiento: string): CategoriaEdad {
  if (!fechaNacimiento) return 'adulto';
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

  if (edad < 12) return 'nino';
  if (edad < 18) return 'adolescente';
  if (edad < 60) return 'adulto';
  return 'adulto_mayor';
}
