import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, ShoppingCart, LogOut, Package, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProfileForm from '@/components/ProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';

interface Order {
  id: string;
  user_id: string;
  order_data: any;
  total_amount: number;
  status: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  billing_info?: any;
  customer_name?: string;
  customer_email?: string;
  invoice_created_by?: string;
  approver_name?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const { toast } = useToast();

  // Kullanıcı adını belirle
  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email || 'Kullanıcı';
  };

  const loadOrders = async () => {
    try {
      console.log('📦 Siparişler yükleniyor...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Siparişler yüklenemedi:', error);
        return;
      }

      console.log('📦 Alınan siparişler:', data);

      // Her sipariş için onaylayan admin bilgisini al
      const ordersWithApprover = await Promise.all(
        (data || []).map(async (order) => {
          if (order.approved_by) {
            console.log(`🔍 ${order.id} siparişi için admin bilgisi alınıyor... approved_by: ${order.approved_by}`);
            const { data: approverData, error: approverError } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', order.approved_by)
              .maybeSingle();
            
            if (approverError) {
              console.error('Admin profili alınırken hata:', approverError);
            }

            console.log('👤 Admin profil verisi:', approverData);
            
            const approverName = approverData?.first_name && approverData?.last_name 
              ? `${approverData.first_name} ${approverData.last_name}`
              : approverData?.email || 'Bilinmeyen Admin';
            
            console.log('✅ Belirlenen admin adı:', approverName);
            
            return {
              ...order,
              approver_name: approverName
            };
          }
          return order;
        })
      );

      console.log('✅ Admin bilgileri ile siparişler:', ordersWithApprover);
      setOrders(ordersWithApprover);
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Bildirimler yüklenemedi:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadOrders(), loadNotifications()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Bildirim güncelleme hatası:', error);
    }
  };

  // Sipariş verisinden para birimini al
  const getOrderCurrency = (order: Order) => {
    if (Array.isArray(order.order_data) && order.order_data.length > 0) {
      const firstItem = order.order_data[0];
      return firstItem.currency || 'TRY';
    }
    return 'TRY';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Bekliyor</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOrderClick = (order: Order) => {
    if (order.status === 'approved' || order.status === 'rejected') {
      setSelectedOrder(order);
      setIsOrderDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors">Kullanıcı Paneli</h1>
              </Link>
              <Badge variant="outline">{profile?.role}</Badge>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profil Düzenle</DialogTitle>
                  </DialogHeader>
                  <ProfileForm onProfileUpdate={() => window.location.reload()} />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden">
                    <User className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profil Düzenle</DialogTitle>
                  </DialogHeader>
                  <ProfileForm onProfileUpdate={() => window.location.reload()} />
                </DialogContent>
              </Dialog>
              <Link to="/products">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Package className="h-4 w-4 mr-2" />
                  Ürünler
                </Button>
              </Link>
              <Link to="/products" className="sm:hidden">
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sepet
                </Button>
              </Link>
              <Link to="/cart" className="sm:hidden">
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Hoş Geldiniz, {getUserDisplayName()}</h2>
          <p className="text-gray-600">Siparişlerinizi ve bildirimlerinizi buradan takip edebilirsiniz.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Siparişler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Son Siparişlerim
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz siparişiniz yok.</p>
              ) : (
                <>
                  <div className="space-y-4 md:hidden">
                    {/* Mobile görünüm */}
                     {orders.map((order) => (
                       <div 
                         key={order.id} 
                         className={`border rounded-lg p-4 space-y-2 ${
                           (order.status === 'approved' || order.status === 'rejected') 
                             ? 'cursor-pointer hover:bg-gray-50' 
                             : ''
                         }`}
                         onClick={() => handleOrderClick(order)}
                       >
                         <div className="flex justify-between items-start">
                           <div>
                             <p className="font-medium">{formatCurrency(order.total_amount, getOrderCurrency(order))}</p>
                             <p className="text-sm text-muted-foreground">
                               {new Date(order.created_at).toLocaleDateString('tr-TR')}
                             </p>
                           </div>
                           {getStatusBadge(order.status)}
                         </div>
                         {(order.status === 'approved' || order.status === 'rejected') && (
                           <p className="text-sm text-muted-foreground">
                             Onaylayan: {order.approver_name || 'Bilinmeyen Admin'}
                           </p>
                         )}
                       </div>
                     ))}
                  </div>
                  <div className="hidden md:block">
                    {/* Desktop görünüm */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Onaylayan</TableHead>
                        </TableRow>
                      </TableHeader>
                       <TableBody>
                         {orders.map((order) => (
                           <TableRow 
                             key={order.id}
                             className={
                               (order.status === 'approved' || order.status === 'rejected') 
                                 ? 'cursor-pointer hover:bg-gray-50' 
                                 : ''
                             }
                             onClick={() => handleOrderClick(order)}
                           >
                             <TableCell>
                               {new Date(order.created_at).toLocaleDateString('tr-TR')}
                             </TableCell>
                             <TableCell>
                               {formatCurrency(order.total_amount, getOrderCurrency(order))}
                             </TableCell>
                             <TableCell>
                               {getStatusBadge(order.status)}
                             </TableCell>
                             <TableCell>
                               {order.status === 'approved' || order.status === 'rejected' 
                                 ? (order.approver_name || 'Bilinmeyen Admin')
                                 : '-'
                               }
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bildirimler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Bildirimler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Bildiriminiz yok.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false);
          setSelectedOrder(null);
        }}
        onOrderAction={() => {}} // Not used in user dashboard
      />
    </div>
  );
};

export default UserDashboard;
