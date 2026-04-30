export type Artesania = {
  id: number;
  nombre: string;
  artesana: string;
  precio: number;
  categoria: string;
  created_at?: string;
};

export type ArtesaniaPayload = {
  nombre: string;
  artesana: string;
  precio: string;
  categoria: string;
};
