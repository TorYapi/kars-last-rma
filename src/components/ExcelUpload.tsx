
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
// Dynamic import for XLSX to reduce initial bundle size
// import * as XLSX from 'xlsx';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExcelUploadProps {
  onProductsUploaded: (products: Product[]) => void;
}

interface ProductWithCurrency extends Product {
  currency: string;
  originalRafFiyati: number;
  originalListeFiyati: number;
  originalIndirim5: number;
  originalIndirim10: number;
  originalIndirim15: number;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onProductsUploaded }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ProductWithCurrency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [detectedCurrency, setDetectedCurrency] = useState<string>('USD');

  // Para birimi algılama fonksiyonu - sembol varlığına bakar, öncelik sırası: USD, EUR, TL
  const detectCurrency = (data: any[][]): string => {
    const sampleValues = [];
    
    // Fiyat sütunlarından örnek değerler al (5., 7., 8., 9., 10. sütunlar)
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (row && row.length > 6) {
        [4, 6, 7, 8, 9].forEach(colIndex => {
          if (row[colIndex]) {
            sampleValues.push(row[colIndex].toString());
          }
        });
      }
    }

    // Para birimi sembolleri kontrolü - öncelik sırası önemli
    const currencyPatterns = [
      { code: 'USD', pattern: /[$]|usd|dollar/i },
      { code: 'EUR', pattern: /[€]|eur|euro/i },
      { code: 'TL', pattern: /[₺]|tl|lira/i }
    ];

    // Öncelik sırasında kontrol et
    for (const { code, pattern } of currencyPatterns) {
      if (sampleValues.some(val => pattern.test(val))) {
        return code;
      }
    }

    // Hiçbir sembol bulunamazsa varsayılan olarak USD döndür
    return 'USD';
  };

  // Para birimi sembolü döndürme fonksiyonu
  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'TL': return '₺';
      default: return '$';
    }
  };

  // Fiyat değerini temizle ve parse et (orijinal para biriminde)
  const parsePrice = (value: any): number => {
    if (!value) return 0;
    
    // String'e çevir ve para birimi sembollerini temizle
    let cleanValue = value.toString()
      .replace(/[$€₺]/g, '')
      .replace(/[,]/g, '.')
      .replace(/[^\d.]/g, '');
    
    const parsed = parseFloat(cleanValue);
    if (isNaN(parsed)) return 0;
    
    return parsed; // Orijinal değeri döndür, çevirme yapma
  };

  const parseExcelFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Dynamic import XLSX to reduce initial bundle size
      const XLSX = await import('xlsx');
      
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Get raw data with formulas preserved
      const jsonData = XLSX.utils.sheet_to_json(sheet, { 
        header: 1,
        defval: '',
        raw: false 
      });

      console.log('Ham veri okundu:', jsonData);
      setRawData(jsonData);

      // Para birimini algıla (sadece sembol varlığına göre)
      const currency = detectCurrency(jsonData as any[][]);
      setDetectedCurrency(currency);
      console.log('Algılanan para birimi:', currency);

      // Skip first few rows if they are empty and start processing from the first data row
      let startRowIndex = 0;
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')) {
          startRowIndex = i;
          break;
        }
      }

      const dataRows = jsonData.slice(startRowIndex);
      console.log('Veri satırları:', dataRows);

      const products: ProductWithCurrency[] = [];

      dataRows.forEach((row: any[], index: number) => {
        if (!row || row.length === 0 || row.every(cell => !cell || cell === '')) {
          return; // Skip empty rows
        }

        // Skip header row if it contains header text
        const firstCell = row[0]?.toString().toUpperCase();
        if (firstCell && (firstCell.includes('STOK') || firstCell.includes('KODU'))) {
          return; // Skip header row
        }

        // 1st: stok kodu, 2nd: firma, 3rd: ürün adı, 4th: birim, 
        // 5th: raf fiyatı kdv dahil, 6th: alış iskonto oranı, 7th: liste fiyatı kdv dahil,
        // 8th: indirim %5, 9th: indirim %10, 10th: indirim %15, 11th: kdv %
        
        const stokKodu = row[0] ? row[0].toString().trim() : '';
        const firma = row[1] ? row[1].toString().trim() : '';
        const urunAdi = row[2] ? row[2].toString().trim() : '';
        const birim = row[3] ? row[3].toString().trim() : '';
        
        // Parse prices without currency conversion - keep original values
        const originalRafFiyati = parsePrice(row[4]);
        const alisIskontoOrani = row[5] ? parseFloat(row[5].toString().replace(',', '.')) || 0 : 0;
        const originalListeFiyati = parsePrice(row[6]);
        const originalIndirim5 = parsePrice(row[7]);
        const originalIndirim10 = parsePrice(row[8]);
        const originalIndirim15 = parsePrice(row[9]);
        const kdv = row[10] ? parseFloat(row[10].toString().replace(',', '.')) || 0 : 0;

        const completeProduct: ProductWithCurrency = {
          stokKodu,
          firma,
          urunAdi,
          birim,
          rafFiyatiKdvDahil: originalRafFiyati, // Store original value for DB
          alisIskontoOrani,
          listeFiyatiKdvDahil: originalListeFiyati, // Store original value for DB
          indirim5: originalIndirim5, // Store original value for DB
          indirim10: originalIndirim10, // Store original value for DB
          indirim15: originalIndirim15, // Store original value for DB
          kdv,
          currency,
          originalRafFiyati,
          originalListeFiyati,
          originalIndirim5,
          originalIndirim10,
          originalIndirim15
        };
        
        products.push(completeProduct);
      });

      console.log('İşlenmiş ürünler:', products);
      setParsedData(products);
      
      if (products.length === 0) {
        setError('Excel dosyasından veri okunamadı. Dosyanın boş olmadığından emin olun.');
      }
      
    } catch (err) {
      console.error('Excel okuma hatası:', err);
      setError(err instanceof Error ? err.message : 'Excel dosyası okunurken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Lütfen geçerli bir Excel dosyası yükleyin (.xlsx veya .xls)');
      return;
    }

    parseExcelFile(file);
  }, [parseExcelFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const confirmUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    try {
      // Supabase'e ürünleri ekle (currency bilgisi ile birlikte)
      const { data, error } = await supabase
        .from('products')
        .insert(
          parsedData.map(product => ({
            stok_kodu: product.stokKodu,
            firma: product.firma,
            urun_adi: product.urunAdi,
            birim: product.birim,
            raf_fiyati_kdv_dahil: product.rafFiyatiKdvDahil,
            alis_iskonto_orani: product.alisIskontoOrani,
            liste_fiyati_kdv_dahil: product.listeFiyatiKdvDahil,
            indirim_5: product.indirim5,
            indirim_10: product.indirim10,
            indirim_15: product.indirim15,
            kdv: product.kdv,
            currency: product.currency // Currency bilgisini kaydet
          }))
        );

      if (error) {
        console.error('Supabase hatası:', error);
        toast({
          title: "Hata!",
          description: `Ürünler kaydedilirken hata oluştu: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: `${parsedData.length} ürün Supabase'e başarıyla kaydedildi. (${detectedCurrency} olarak)`,
      });

      // Convert to regular Product format for callback
      const regularProducts: Product[] = parsedData.map(p => ({
        stokKodu: p.stokKodu,
        firma: p.firma,
        urunAdi: p.urunAdi,
        birim: p.birim,
        rafFiyatiKdvDahil: p.rafFiyatiKdvDahil,
        alisIskontoOrani: p.alisIskontoOrani,
        listeFiyatiKdvDahil: p.listeFiyatiKdvDahil,
        indirim5: p.indirim5,
        indirim10: p.indirim10,
        indirim15: p.indirim15,
        kdv: p.kdv,
        currency: p.currency
      }));

      onProductsUploaded(regularProducts);
      setParsedData([]);
      setRawData([]);
      
    } catch (err) {
      console.error('Upload hatası:', err);
      toast({
        title: "Hata!",
        description: "Ürünler kaydedilirken beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Dosyası Yükleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Excel Sütun Formatı:</h4>
            <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
              <div>1. Stok Kodu</div>
              <div>7. Liste Fiyatı KDV Dahil</div>
              <div>2. Firma</div>
              <div>8. İndirim %5</div>
              <div>3. Ürün Adı</div>
              <div>9. İndirim %10</div>
              <div>4. Birim</div>
              <div>10. İndirim %15</div>
              <div>5. Raf Fiyatı KDV Dahil</div>
              <div>11. KDV %</div>
              <div>6. Alış İskonto Oranı</div>
            </div>
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2 text-green-800">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Para Birimi Desteği:</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                USD ($), EUR (€), TL (₺) sembolleri fiyatlarda bulunursa otomatik algılanır. Öncelik sırası: USD → EUR → TL. Sembol yoksa varsayılan USD olarak kaydedilir.
              </p>
            </div>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Excel dosyanızı buraya sürükleyin veya{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                seçin
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              .xlsx ve .xls dosyaları desteklenir
            </p>
          </div>

          {isUploading && (
            <div className="mt-4 text-center">
              <p className="text-blue-600">
                {parsedData.length > 0 ? 'Veriler Supabase\'e kaydediliyor...' : 'Excel dosyası okunuyor...'}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Önizleme ({parsedData.length} ürün)
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {detectedCurrency} Orijinal Fiyatlar
                </span>
              </CardTitle>
              <Button onClick={confirmUpload} disabled={isUploading}>
                {isUploading ? 'Kaydediliyor...' : 'Onayla & Supabase\'e Kaydet'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stok Kodu</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead>Raf Fiyatı ({detectedCurrency})</TableHead>
                    <TableHead>İskonto Oranı</TableHead>
                    <TableHead>Liste Fiyatı ({detectedCurrency})</TableHead>
                    <TableHead>%5 İndirim ({detectedCurrency})</TableHead>
                    <TableHead>%10 İndirim ({detectedCurrency})</TableHead>
                    <TableHead>%15 İndirim ({detectedCurrency})</TableHead>
                    <TableHead>KDV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{product.stokKodu}</TableCell>
                      <TableCell>{product.firma}</TableCell>
                      <TableCell>{product.urunAdi}</TableCell>
                      <TableCell>{product.birim}</TableCell>
                      <TableCell>{getCurrencySymbol(product.currency)}{product.originalRafFiyati?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{product.alisIskontoOrani}%</TableCell>
                      <TableCell>{getCurrencySymbol(product.currency)}{product.originalListeFiyati?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{getCurrencySymbol(product.currency)}{product.originalIndirim5?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{getCurrencySymbol(product.currency)}{product.originalIndirim10?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{getCurrencySymbol(product.currency)}{product.originalIndirim15?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{product.kdv}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  İlk 10 tanesi gösteriliyor, toplam {parsedData.length} ürün
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Debug View */}
      {rawData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ham Veri Kontrolü</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-auto">
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(rawData.slice(0, 5), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelUpload;
