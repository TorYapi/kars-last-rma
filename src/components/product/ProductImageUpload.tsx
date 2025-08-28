
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductImageUploadProps {
  productId: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
}

const ProductImageUpload = ({ productId, currentImageUrl, onImageUploaded }: ProductImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir resim dosyası seçin.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Yükleme Hatası",
          description: "Resim yüklenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update product with image URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('stok_kodu', productId)
        .neq('stok_kodu', '');

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Güncelleme Hatası",
          description: "Ürün resmi veritabanında güncellenemedi.",
          variant: "destructive"
        });
        return;
      }

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      toast({
        title: "Başarılı",
        description: "Ürün resmi başarıyla yüklendi."
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      // Update product to remove image URL
      const { error } = await supabase
        .from('products')
        .update({ image_url: null })
        .eq('stok_kodu', productId)
        .neq('stok_kodu', '');

      if (error) {
        console.error('Remove error:', error);
        toast({
          title: "Hata",
          description: "Resim kaldırılırken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setPreviewUrl(null);
      onImageUploaded('');
      
      toast({
        title: "Başarılı",
        description: "Ürün resmi kaldırıldı."
      });

    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative">
              <div className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="w-full h-auto object-contain bg-white"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-48">
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz resim yüklenmemiş</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Yükleniyor...' : previewUrl ? 'Resmi Değiştir' : 'Resim Yükle'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Maksimum dosya boyutu: 5MB | Desteklenen formatlar: JPG, PNG, GIF
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductImageUpload;
