export type Artesania = {
  id: number;
  nombre: string;
  artesana: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  created_at?: string;
};

export type ArtesaniaPayload = {
  nombre: string;
  artesana: string;
  precio: string;
  categoria: string;
  imagen_url: string;
};
