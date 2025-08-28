import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CartItem extends Product {
  quantity: number;
  appliedDiscount?: number;
  cartId: string;
  variantId?: string;
  selectedVariant?: string; // Add selected variant name
}

interface BillingInfo {
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  invoiceCreatedBy: string; // Yeni alan - Faturayı Düzenleyen Kişi
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Türkiye',
    notes: '',
    invoiceCreatedBy: '' // Yeni alan - Faturayı Düzenleyen Kişi
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart) as CartItem[];
      // Ensure each item has proper IDs - no need to regenerate if they exist
      const itemsWithIds = items.map((item: CartItem, index: number) => ({
        ...item,
        appliedDiscount: item.appliedDiscount || 0,
        cartId: item.cartId || `fallback-${index}-${Date.now()}`,
        variantId: item.variantId || `fallback-variant-${index}`,
        selectedVariant: item.selectedVariant || undefined
      }));
      console.log('🛒 Loaded cart items:', itemsWithIds.length);
      setCartItems(itemsWithIds);
    }
  };

  const updateQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const applyDiscount = (cartId: string, discountPercent: number) => {
    const updatedCart = cartItems.map(item =>
      item.cartId === cartId ? { ...item, appliedDiscount: discountPercent } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    toast({
      title: `%${discountPercent} indirim uygulandı`,
      description: "Ürün fiyatı güncellendi.",
    });
  };

  const removeItem = (cartId: string) => {
    const updatedCart = cartItems.filter(item => item.cartId !== cartId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    toast({
      title: "Ürün sepetten çıkarıldı",
      description: "Ürün başarıyla sepetinizden kaldırıldı.",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setBillingInfo({
      companyName: '',
      taxOffice: '',
      taxNumber: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Türkiye',
      notes: '',
      invoiceCreatedBy: '' // Yeni alan sıfırlama
    });
    localStorage.removeItem('cart');
    toast({
      title: "Sepet temizlendi",
      description: "Tüm ürünler sepetinizden kaldırıldı.",
    });
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'TL':
      default:
        return '₺';
    }
  };

  const calculateDiscountedPrice = (item: CartItem) => {
    const discountAmount = (item.listeFiyatiKdvDahil * (item.appliedDiscount || 0)) / 100;
    return item.listeFiyatiKdvDahil - discountAmount;
  };

  const calculateItemTotal = (item: CartItem) => {
    return calculateDiscountedPrice(item) * item.quantity;
  };

  const calculateGrandTotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const getStockCode = (item: CartItem) => {
    // Excel'den gelen stok kodu varsa onu kullan, yoksa mevcut stokKodu'nu kullan
    return item.excelStokKodu || item.stokKodu || 'Stok kodu yok';
  };

  const updateBillingInfo = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitOrder = async () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "Sipariş vermek için giriş yapmalısınız.",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Sepet Boş",
        description: "Sipariş vermek için sepetinizde ürün olmalı.",
        variant: "destructive"
      });
      return;
    }

    // Validate required billing fields including invoiceCreatedBy
    const requiredFields = ['companyName', 'taxOffice', 'taxNumber', 'contactPerson', 'phone', 'email', 'address', 'city', 'invoiceCreatedBy'];
    const missingFields = requiredFields.filter(field => !billingInfo[field as keyof BillingInfo]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen tüm zorunlu fatura bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = cartItems.map(item => ({
        cartId: item.cartId,
        stokKodu: item.stokKodu || '',
        urunAdi: item.urunAdi || '',
        firma: item.firma || '',
        currency: item.currency || 'USD',
        listeFiyatiKdvDahil: Number(item.listeFiyatiKdvDahil) || 0,
        indirim5: Number(item.indirim5) || 0,
        indirim10: Number(item.indirim10) || 0,
        indirim15: Number(item.indirim15) || 0,
        quantity: Number(item.quantity) || 1,
        appliedDiscount: Number(item.appliedDiscount) || 0,
        discountedPrice: Number(calculateDiscountedPrice(item)) || 0,
        total: Number(calculateItemTotal(item)) || 0,
        variantId: item.variantId || item.stokKodu
      }));

      console.log('Order data being sent:', orderData);
      console.log('Billing info being sent:', billingInfo);
      console.log('Total amount:', calculateGrandTotal());

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_data: orderData as any,
          billing_info: billingInfo as any,
          total_amount: Number(calculateGrandTotal()),
          status: 'pending'
        });

      if (error) {
        console.error('Sipariş hatası:', error);
        toast({
          title: "Sipariş Hatası!",
          description: `Sipariş verilirken hata oluştu: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      clearCart();
      
      toast({
        title: "Sipariş Başarılı!",
        description: "Siparişiniz alındı. Admin onayı bekleniyor.",
      });

    } catch (error) {
      console.error('Sipariş hatası:', error);
      toast({
        title: "Bağlantı Hatası!",
        description: "Sipariş verilirken hata oluştu.",
        variant: "destructive"
      });
    }
  };

  // Sipariş ver butonu aktif olma kontrolü
  const isSubmitDisabled = () => {
    const requiredFields = ['companyName', 'taxOffice', 'taxNumber', 'contactPerson', 'phone', 'email', 'address', 'city', 'invoiceCreatedBy'];
    return requiredFields.some(field => !billingInfo[field as keyof BillingInfo]) || cartItems.length === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ürünlere Dön
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Sepetim</h1>
            </div>
            {cartItems.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Sepeti Temizle
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Sepetiniz Boş</h3>
              <p className="text-gray-600 mb-4">
                Sepetinizde henüz ürün bulunmuyor. Ürün katalogunu inceleyerek alışverişe başlayın.
              </p>
              <Link to="/products">
                <Button>
                  Ürünleri İncele
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sepet Özeti ({cartItems.length} ürün)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>İndirim</TableHead>
                      <TableHead>Adet</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.cartId}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{item.urunAdi}</div>
                            <div className="text-sm text-gray-600">
                              <Badge variant="outline" className="mr-2">{item.firma}</Badge>
                              Stok Kodu: {getStockCode(item)}
                              {item.selectedVariant && (
                                <span className="ml-2 text-blue-600 font-medium">
                                  {item.selectedVariant}
                                </span>
                              )}
                              {item.variantId && item.variantId !== item.stokKodu && !item.selectedVariant && (
                                <span className="ml-2 text-blue-600">Varyant: {item.variantId}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {item.appliedDiscount > 0 && (
                              <div className="text-sm text-gray-500 line-through">
                                {getCurrencySymbol(item.currency)}{item.listeFiyatiKdvDahil.toFixed(2)}
                              </div>
                            )}
                            <div className={item.appliedDiscount > 0 ? "text-green-600 font-semibold" : ""}>
                              {getCurrencySymbol(item.currency)}{calculateDiscountedPrice(item).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant={item.appliedDiscount === 5 ? "default" : "outline"}
                              size="sm"
                              onClick={() => applyDiscount(item.cartId, 5)}
                              className="text-xs px-2 py-1"
                            >
                              %5
                            </Button>
                            <Button
                              variant={item.appliedDiscount === 10 ? "default" : "outline"}
                              size="sm"
                              onClick={() => applyDiscount(item.cartId, 10)}
                              className="text-xs px-2 py-1"
                            >
                              %10
                            </Button>
                            <Button
                              variant={item.appliedDiscount === 15 ? "default" : "outline"}
                              size="sm"
                              onClick={() => applyDiscount(item.cartId, 15)}
                              className="text-xs px-2 py-1"
                            >
                              %15
                            </Button>
                            {item.appliedDiscount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => applyDiscount(item.cartId, 0)}
                                className="text-xs px-2 py-1"
                              >
                                Sıfırla
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.cartId, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {getCurrencySymbol(item.currency)}{calculateItemTotal(item).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.cartId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Fatura Bilgileri Formu */}
            <Card>
              <CardHeader>
                <CardTitle>Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Firma Adı *</Label>
                    <Input
                      id="companyName"
                      value={billingInfo.companyName}
                      onChange={(e) => updateBillingInfo('companyName', e.target.value)}
                      placeholder="Firma adını girin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxOffice">Vergi Dairesi *</Label>
                    <Input
                      id="taxOffice"
                      value={billingInfo.taxOffice}
                      onChange={(e) => updateBillingInfo('taxOffice', e.target.value)}
                      placeholder="Vergi dairesi adı"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                    <Input
                      id="taxNumber"
                      value={billingInfo.taxNumber}
                      onChange={(e) => updateBillingInfo('taxNumber', e.target.value)}
                      placeholder="Vergi numarası"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">İletişim Kişisi *</Label>
                    <Input
                      id="contactPerson"
                      value={billingInfo.contactPerson}
                      onChange={(e) => updateBillingInfo('contactPerson', e.target.value)}
                      placeholder="İletişim kişisi adı"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={billingInfo.phone}
                      onChange={(e) => updateBillingInfo('phone', e.target.value)}
                      placeholder="Telefon numarası"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => updateBillingInfo('email', e.target.value)}
                      placeholder="E-posta adresi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceCreatedBy">Faturayı Düzenleyen Kişi *</Label>
                    <Input
                      id="invoiceCreatedBy"
                      value={billingInfo.invoiceCreatedBy}
                      onChange={(e) => updateBillingInfo('invoiceCreatedBy', e.target.value)}
                      placeholder="Faturayı düzenleyen kişinin adı"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Adres *</Label>
                    <Textarea
                      id="address"
                      value={billingInfo.address}
                      onChange={(e) => updateBillingInfo('address', e.target.value)}
                      placeholder="Fatura adresi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={billingInfo.city}
                      onChange={(e) => updateBillingInfo('city', e.target.value)}
                      placeholder="Şehir"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      value={billingInfo.postalCode}
                      onChange={(e) => updateBillingInfo('postalCode', e.target.value)}
                      placeholder="Posta kodu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Ülke</Label>
                    <Input
                      id="country"
                      value={billingInfo.country}
                      onChange={(e) => updateBillingInfo('country', e.target.value)}
                      placeholder="Ülke"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Ek Notlar</Label>
                    <Textarea
                      id="notes"
                      value={billingInfo.notes}
                      onChange={(e) => updateBillingInfo('notes', e.target.value)}
                      placeholder="Sipariş ile ilgili ek notlar"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">Genel Toplam</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {getCurrencySymbol(cartItems[0]?.currency)}{calculateGrandTotal().toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={submitOrder}
                    disabled={isSubmitDisabled()}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sipariş Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
