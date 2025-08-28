
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface OrdersTabProps {
  orders: Order[];
  companies: string[];
  selectedCompany: string | null;
  onCompanyChange: (company: string | null) => void;
  onOrderAction: (orderId: string, action: string) => void;
  onOrderDetail: (order: Order) => void;
}

const OrdersTab = ({
  orders,
  companies,
  selectedCompany,
  onCompanyChange,
  onOrderAction,
  onOrderDetail
}: OrdersTabProps) => {
  const filteredOrders = selectedCompany && selectedCompany !== 'all'
    ? orders.filter(order =>
        Array.isArray(order.order_data) && 
        order.order_data.some((item: { firma: string; }) => item.firma === selectedCompany)
      )
    : orders;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sipariş Onay Listesi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select onValueChange={(value) => onCompanyChange(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Firma Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faturayı Düzenleyen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <div className="font-semibold">{order.customer_name}</div>
                    {order.customer_email && (
                      <div className="text-sm text-gray-600">{order.customer_email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {formatCurrency(order.total_amount, 'USD')}
                </TableCell>
                <TableCell>
                  <Badge 
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
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOrderDetail(order)}
                    >
                      Detay
                    </Button>
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => onOrderAction(order.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Onayla
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => onOrderAction(order.id, 'rejected')}
                        >
                          Reddet
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrdersTab;
