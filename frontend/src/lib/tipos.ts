export const TIPOS = [
  { valor: 'CANTONEIRA', slug: 'cantoneira', rotulo: 'Cantoneira', color: '#fd4b15'},
  { valor: 'VIGAU', slug: 'viga-u', rotulo: 'Viga U', color: '#f1ff2e' },
  { valor: 'VIGAI', slug: 'viga-i', rotulo: 'Viga I', color: '#ff0000'},
  { valor: 'METALON', slug: 'metalon', rotulo: 'Metalon', color: '#58fb00' },
  { valor: 'CANO', slug: 'cano', rotulo: 'Cano', color: '#00f5ac' },
  { valor: 'CHAPA', slug: 'chapa', rotulo: 'Chapa', color: '#00f8f0' },
  { valor: 'FERROOBRA', slug: 'ferro-de-obra', rotulo: 'Ferro de obra', color: '#0055ff' },
  { valor: 'TELHA', slug: 'telha', rotulo: 'Telha', color: '#5c16ff' },
  { valor: 'BORRACHA', slug: 'borracha', rotulo: 'Borracha', color: '#ff00fb' },
  { valor: 'INOX', slug: 'inox', rotulo: 'Inox', color: '#9f00e8' },
  { valor: 'POLIA', slug: 'polia', rotulo: 'Polia', color: '#ff6200'}
] as const;

export type TipoProduto = (typeof TIPOS)[number]['valor'];

export function porSlug(slug: string){
    return TIPOS.find((t) => t.slug === slug)
}