
export interface Product {
  stokKodu: string;
  firma: string;
  urunAdi: string;
  birim: string;
  rafFiyatiKdvDahil: number;
  alisIskontoOrani: number;
  listeFiyatiKdvDahil: number;
  indirim5: number;
  indirim10: number;
  indirim15: number;
  kdv: number;
  currency?: string; // Para birimi bilgisi eklendi
  image_url?: string; // Ürün resim URL'si eklendi
  // Excel'den gelen gerçek stok kodu
  excelStokKodu?: string;
}

export interface ProductRow {
  [key: string]: any;
}
