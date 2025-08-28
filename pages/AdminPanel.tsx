import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CompanyContacts from '@/components/CompanyContacts';
import { lazy, Suspense } from 'react';

// Lazy load admin components for better performance
const OrdersTab = lazy(() => import('@/components/admin/OrdersTab'));
const CompaniesTab = lazy(() => import('@/components/admin/CompaniesTab'));
const UsersTab = lazy(() => import('@/components/admin/UsersTab'));
const RestrictedTermsTab = lazy(() => import('@/components/admin/RestrictedTermsTab'));
const ProductImageManager = lazy(() => import('@/components/admin/ProductImageManager'));
const AnalyticsTab = lazy(() => import('@/components/admin/AnalyticsTab'));
const UserAnalyticsTab = lazy(() => import('@/components/admin/UserAnalyticsTab'));
const UnsuccessfulSearchesTab = lazy(() => import('@/components/admin/UnsuccessfulSearchesTab'));
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
import ApprovalConfirmDialog from '@/components/admin/ApprovalConfirmDialog';

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

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approvalConfirmationOpen, setApprovalConfirmationOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCompanyForContacts, setSelectedCompanyForContacts] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      console.log('🔄 Siparişler yükleniyor...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Siparişler yüklenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Siparişler yüklenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      console.log('📦 Yüklenen siparişler:', data);

      // Her sipariş için müşteri bilgilerini al
      const ordersWithCustomers = await Promise.all(
        (data || []).map(async (order) => {
          console.log(`🔍 ${order.id} siparişi için müşteri bilgileri alınıyor...`);
          console.log('👤 Aranan user_id:', order.user_id);
          
          // Fatura bilgilerinden faturayı düzenleyen kişi adını al
          const invoiceCreatedBy = order.billing_info && typeof order.billing_info === 'object' 
            ? (order.billing_info as any).invoiceCreatedBy || '' 
            : '';
          
          // Müşteri adını belirle - önce faturayı düzenleyen kişi adını kontrol et
          let customerName = '';
          let customerEmail = '';
          
          if (invoiceCreatedBy) {
            customerName = invoiceCreatedBy;
            console.log('✅ Faturayı düzenleyen kişi bulundu:', customerName);
          } else {
            // Faturayı düzenleyen kişi yoksa profiles tablosundan kullanıcı bilgilerini al
            try {
              const { data: customerData, error: customerError } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', order.user_id)
                .maybeSingle();
              
              if (customerError && customerError.code !== 'PGRST116') {
                console.error('❌ Müşteri bilgileri alınamadı:', customerError);
                customerName = 'Bilinmeyen Müşteri';
              } else if (customerData) {
                console.log('✅ Müşteri bilgileri:', customerData);
                if (customerData.first_name && customerData.last_name) {
                  customerName = `${customerData.first_name} ${customerData.last_name}`;
                } else if (customerData.first_name) {
                  customerName = customerData.first_name;
                } else if (customerData.email) {
                  customerName = customerData.email;
                } else {
                  customerName = 'Bilinmeyen Müşteri';
                }
                customerEmail = customerData.email || '';
              } else {
                console.log('⚠️ Profiles tablosunda kullanıcı bulunamadı');
                customerName = 'Bilinmeyen Müşteri';
              }
            } catch (error) {
              console.error('❌ Müşteri bilgileri alınırken hata:', error);
              customerName = 'Bilinmeyen Müşteri';
            }
          }
          
          console.log('✅ Belirlenen müşteri adı:', customerName);
          
          return {
            ...order,
            customer_name: customerName,
            customer_email: customerEmail,
            invoice_created_by: invoiceCreatedBy
          };
        })
      );

      console.log('✅ Müşteri bilgileri ile siparişler:', ordersWithCustomers);
      setOrders(ordersWithCustomers);

      // Benzersiz firma adlarını çıkar
      const uniqueCompanies = [...new Set(
        ordersWithCustomers.flatMap(order => 
          Array.isArray(order.order_data) 
            ? order.order_data.map((item: { firma: any; }) => item.firma)
            : []
        )
      )];
      setCompanies(uniqueCompanies);
    } catch (error) {
      console.error('❌ Siparişler yüklenirken beklenmeyen hata:', error);
      toast({
        title: "Hata!",
        description: "Siparişler yüklenirken beklenmeyen hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleOrderAction = (orderId: string, action: string) => {
    setSelectedOrderId(orderId);
    setApprovalConfirmationOpen(true);
  };

  const confirmOrderAction = async () => {
    setApprovalConfirmationOpen(false);
    if (!selectedOrderId) return;

    try {
      const { data: authData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'approved', 
          approved_by: authData.user?.id, 
          approved_at: new Date().toISOString() 
        })
        .eq('id', selectedOrderId);

      if (error) {
        console.error('❌ Sipariş durumu güncellenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Sipariş durumu güncellenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "Sipariş durumu başarıyla güncellendi.",
      });
      loadOrders();
    } catch (error) {
      console.error('❌ Sipariş durumu güncellenirken beklenmeyen hata:', error);
      toast({
        title: "Hata!",
        description: "Sipariş durumu güncellenirken beklenmeyen hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSelectedOrderId(null);
    }
  };

  const handleCompanyClick = (companyName: string) => {
    setSelectedCompanyForContacts(companyName);
  };

  // Eğer firma detay sayfası açıksa, onu göster
  if (selectedCompanyForContacts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Ana Sayfa
                  </Button>
                </Link>
                <Link to="/" className="sm:hidden">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Admin</h1>
              </div>
              <Button onClick={() => supabase.auth.signOut()} size="sm" variant="ghost">
                <span className="hidden sm:inline">Çıkış Yap</span>
                <span className="sm:hidden">Çıkış</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CompanyContacts 
            companyName={selectedCompanyForContacts}
            onClose={() => setSelectedCompanyForContacts(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <Link to="/" className="sm:hidden">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors">Admin Paneli</h1>
              </Link>
            </div>
            <Button onClick={() => supabase.auth.signOut()} size="sm" className="hidden sm:flex">
              Çıkış Yap
            </Button>
            <Button onClick={() => supabase.auth.signOut()} size="sm" className="sm:hidden" variant="ghost">
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-gray-100 border-b sticky top-16 z-10">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 px-3 py-3 min-w-max">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => handleTabChange('orders')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden sm:inline">Siparişler</span>
              <span className="sm:hidden">Sipariş</span>
            </Button>
            <Button
              variant={activeTab === 'companies' ? 'default' : 'outline'}
              onClick={() => handleTabChange('companies')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden sm:inline">Firma İletişim</span>
              <span className="sm:hidden">Firma</span>
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => handleTabChange('users')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden sm:inline">Kullanıcılar</span>
              <span className="sm:hidden">Kullanıcı</span>
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => handleTabChange('analytics')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analiz</span>
            </Button>
            <Button
              variant={activeTab === 'restrictions' ? 'default' : 'outline'}
              onClick={() => handleTabChange('restrictions')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden md:inline">Kelime Sınırlandırma</span>
              <span className="md:hidden">Kelime</span>
            </Button>
            <Button
              variant={activeTab === 'product-images' ? 'default' : 'outline'}
              onClick={() => handleTabChange('product-images')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden md:inline">Ürün Resimleri</span>
              <span className="md:hidden">Resim</span>
            </Button>
            <Button
              variant={activeTab === 'user-analytics' ? 'default' : 'outline'}
              onClick={() => handleTabChange('user-analytics')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden lg:inline">Kullanıcı Analizleri</span>
              <span className="lg:hidden">K.Analiz</span>
            </Button>
            <Button
              variant={activeTab === 'unsuccessful-searches' ? 'default' : 'outline'}
              onClick={() => handleTabChange('unsuccessful-searches')}
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 h-8 min-w-fit flex-shrink-0"
            >
              <span className="hidden lg:inline">Sonuçsuz Aramalar</span>
              <span className="lg:hidden">S.Arama</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Yükleniyor...</span>
          </div>
        }>
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              companies={companies}
              selectedCompany={selectedCompany}
              onCompanyChange={setSelectedCompany}
              onOrderAction={handleOrderAction}
              onOrderDetail={setSelectedOrder}
            />
          )}

          {activeTab === 'restrictions' && (
            <RestrictedTermsTab />
          )}

          {activeTab === 'companies' && (
            <CompaniesTab
              companies={companies}
              onCompanyClick={handleCompanyClick}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab />
          )}

          {activeTab === 'product-images' && (
            <ProductImageManager />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab />
          )}

          {activeTab === 'user-analytics' && (
            <UserAnalyticsTab />
          )}

          {activeTab === 'unsuccessful-searches' && (
            <UnsuccessfulSearchesTab />
          )}
        </Suspense>

        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderAction={handleOrderAction}
        />

        <ApprovalConfirmDialog
          isOpen={approvalConfirmationOpen}
          onClose={() => setApprovalConfirmationOpen(false)}
          onConfirm={confirmOrderAction}
        />
      </main>
    </div>
  );
};

export default AdminPanel;
