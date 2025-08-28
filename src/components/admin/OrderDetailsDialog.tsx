
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: string;
  user_id: string;
  order_data: any;
  total_amount: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  customer_name?: string;
  customer_email?: string;
  billing_info?: any;
  invoice_created_by?: string;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderAction: (orderId: string, action: string) => void;
}

const OrderDetailsDialog = ({ order, isOpen, onClose, onOrderAction }: OrderDetailsDialogProps) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Sipariş Detayı</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm sm:text-base">
                <span className="font-medium">Sipariş ID:</span> 
                <span className="block sm:inline ml-0 sm:ml-1 text-xs sm:text-sm break-all">{order.id}</span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="font-medium">Faturayı Düzenleyen:</span> 
                <span className="block sm:inline ml-0 sm:ml-1">{order.customer_name}</span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="font-medium">Email:</span> 
                <span className="block sm:inline ml-0 sm:ml-1 break-all">{order.customer_email}</span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="font-medium">Tarih:</span> 
                <span className="block sm:inline ml-0 sm:ml-1">{new Date(order.created_at).toLocaleString('tr-TR')}</span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="font-medium">Durum:</span> 
                <Badge 
                  className="ml-0 sm:ml-2 mt-1 sm:mt-0"
                  variant={
                    order.status === 'approved' ? 'default' : 
                    order.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {order.status === 'approved' ? 'Onaylandı' : 
                   order.status === 'rejected' ? 'Reddedildi' : 
                   'Bekliyor'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm sm:text-base">
                <span className="font-medium">Toplam Tutar:</span> 
                <span className="block sm:inline ml-0 sm:ml-1">{formatCurrency(order.total_amount, 'USD')}</span>
              </div>
              {order.approved_at && (
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Onay Tarihi:</span> 
                  <span className="block sm:inline ml-0 sm:ml-1">{new Date(order.approved_at).toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Fatura Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Firma Adı:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.companyName}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Vergi Dairesi:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.taxOffice}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Vergi Numarası:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.taxNumber}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">İletişim Kişisi:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.contactPerson}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Telefon:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.phone}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">E-posta:</span>
                  <span className="block sm:inline ml-0 sm:ml-1 break-all">{order.billing_info?.email}</span>
                </div>
                <div className="sm:col-span-2 text-sm sm:text-base">
                  <span className="font-medium">Adres:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.address}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Şehir:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.city}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Posta Kodu:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.postalCode}</span>
                </div>
                <div className="text-sm sm:text-base">
                  <span className="font-medium">Ülke:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.country}</span>
                </div>
                <div className="sm:col-span-2 text-sm sm:text-base">
                  <span className="font-medium">Ek Notlar:</span>
                  <span className="block sm:inline ml-0 sm:ml-1">{order.billing_info?.notes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Sipariş Kalemleri</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile görünüm */}
              <div className="sm:hidden space-y-4">
                {Array.isArray(order.order_data) && order.order_data.map((item: any) => (
                  <div key={item.stokKodu} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{item.urunAdi}</div>
                    <div className="text-sm text-gray-600">Firma: {item.firma}</div>
                    <div className="text-sm">
                      {item.appliedDiscount > 0 && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatCurrency(item.listeFiyatiKdvDahil, item.currency)}
                        </div>
                      )}
                      <div className={item.appliedDiscount > 0 ? "text-green-600 font-semibold" : ""}>
                        Birim: {formatCurrency(item.discountedPrice || item.listeFiyatiKdvDahil, item.currency)}
                      </div>
                      {item.appliedDiscount > 0 && (
                        <div className="text-xs text-green-600">
                          %{item.appliedDiscount} indirim
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Adet: {item.quantity}</span>
                      <span className="font-medium">
                        {formatCurrency(item.total || (item.discountedPrice || item.listeFiyatiKdvDahil) * item.quantity, item.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop görünüm */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Adet</TableHead>
                      <TableHead>Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(order.order_data) && order.order_data.map((item: any) => (
                      <TableRow key={item.stokKodu}>
                        <TableCell>{item.urunAdi}</TableCell>
                        <TableCell>{item.firma}</TableCell>
                        <TableCell>
                          <div>
                            {item.appliedDiscount > 0 && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatCurrency(item.listeFiyatiKdvDahil, item.currency)}
                              </div>
                            )}
                            <div className={item.appliedDiscount > 0 ? "text-green-600 font-semibold" : ""}>
                              {formatCurrency(item.discountedPrice || item.listeFiyatiKdvDahil, item.currency)}
                            </div>
                            {item.appliedDiscount > 0 && (
                              <div className="text-xs text-green-600">
                                %{item.appliedDiscount} indirim
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.total || (item.discountedPrice || item.listeFiyatiKdvDahil) * item.quantity, item.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {order.status === 'pending' && (
            <div className="flex justify-end space-x-2">
              <Button 
                variant="destructive" 
                onClick={() => onOrderAction(order.id, 'rejected')}
              >
                Siparişi Reddet
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onOrderAction(order.id, 'approved')}
              >
                Siparişi Onayla
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
