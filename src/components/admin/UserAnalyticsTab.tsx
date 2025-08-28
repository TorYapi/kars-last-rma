import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, DollarSign, Activity } from 'lucide-react';

interface UserActivityAnalytics {
  userId: string;
  userName: string;
  email: string;
  totalSessions: number;
  totalActiveTime: number; // dakika cinsinden
  avgSessionDuration: number;
  lastActiveDate: string;
  totalPageViews: number;
  totalActions: number;
}

interface UserRevenueAnalytics {
  userId: string;
  userName: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastOrderDate: string;
  approvedOrders: number;
  pendingOrders: number;
}

interface ActivityTypeStats {
  activityType: string;
  count: number;
  color: string;
}

const UserAnalyticsTab = () => {
  const [userActivities, setUserActivities] = useState<UserActivityAnalytics[]>([]);
  const [userRevenues, setUserRevenues] = useState<UserRevenueAnalytics[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserAnalytics();
  }, []);

  const loadUserAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserActivityAnalytics(),
        loadUserRevenueAnalytics(),
        loadActivityTypeStats()
      ]);
    } catch (error) {
      console.error('User analytics yüklenirken hata:', error);
      toast({
        title: "Hata!",
        description: "Kullanıcı analizi verileri yüklenirken hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivityAnalytics = async () => {
    // Kullanıcıları ve oturum verilerini al
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');

    if (usersError) {
      console.error('Kullanıcı verileri yüklenirken hata:', usersError);
      return;
    }

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*');

    if (sessionsError) {
      console.error('Oturum verileri yüklenirken hata:', sessionsError);
      return;
    }

    const { data: activitiesData, error: activitiesError } = await supabase
      .from('user_activities')
      .select('user_id, activity_type, created_at')
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('Aktivite verileri yüklenirken hata:', activitiesError);
      return;
    }

    // Kullanıcı başına analiz
    const userAnalytics: UserActivityAnalytics[] = usersData?.map(user => {
      const userSessions = sessionsData?.filter(session => session.user_id === user.id) || [];
      const userActivities = activitiesData?.filter(activity => activity.user_id === user.id) || [];
      
      const totalActiveTime = userSessions.reduce((total, session) => 
        total + (session.duration_minutes || 0), 0
      );
      
      const avgSessionDuration = userSessions.length > 0 
        ? totalActiveTime / userSessions.length 
        : 0;

      const totalPageViews = userSessions.reduce((total, session) => 
        total + (session.page_views || 0), 0
      );

      const totalActions = userSessions.reduce((total, session) => 
        total + (session.actions_count || 0), 0
      );

      const lastActivity = userActivities[0]?.created_at || '';

      return {
        userId: user.id,
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'İsimsiz',
        email: user.email || 'Email yok',
        totalSessions: userSessions.length,
        totalActiveTime,
        avgSessionDuration: Math.round(avgSessionDuration),
        lastActiveDate: lastActivity ? new Date(lastActivity).toLocaleDateString('tr-TR') : 'Hiç aktif olmamış',
        totalPageViews,
        totalActions
      };
    }) || [];

    // Toplam aktif zamana göre sırala
    const sortedAnalytics = userAnalytics.sort((a, b) => b.totalActiveTime - a.totalActiveTime);
    setUserActivities(sortedAnalytics);
  };

  const loadUserRevenueAnalytics = async () => {
    // Kullanıcıları ve sipariş verilerini al
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');

    if (usersError) {
      console.error('Kullanıcı verileri yüklenirken hata:', usersError);
      return;
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total_amount, status, created_at')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Sipariş verileri yüklenirken hata:', ordersError);
      return;
    }

    // Kullanıcı başına gelir analizi
    const userRevenues: UserRevenueAnalytics[] = usersData?.map(user => {
      const userOrders = ordersData?.filter(order => order.user_id === user.id) || [];
      
      const totalRevenue = userOrders
        .filter(order => order.status === 'approved')
        .reduce((total, order) => total + (order.total_amount || 0), 0);
      
      const approvedOrders = userOrders.filter(order => order.status === 'approved').length;
      const pendingOrders = userOrders.filter(order => order.status === 'pending').length;
      
      const avgOrderValue = approvedOrders > 0 ? totalRevenue / approvedOrders : 0;
      
      const lastOrder = userOrders[0];
      const lastOrderDate = lastOrder 
        ? new Date(lastOrder.created_at).toLocaleDateString('tr-TR')
        : 'Hiç sipariş vermemiş';

      return {
        userId: user.id,
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'İsimsiz',
        email: user.email || 'Email yok',
        totalOrders: userOrders.length,
        totalRevenue,
        avgOrderValue,
        lastOrderDate,
        approvedOrders,
        pendingOrders
      };
    }) || [];

    // Toplam gelire göre sırala
    const sortedRevenues = userRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);
    setUserRevenues(sortedRevenues);
  };

  const loadActivityTypeStats = async () => {
    const { data: activitiesData, error } = await supabase
      .from('user_activities')
      .select('activity_type');

    if (error) {
      console.error('Aktivite türü verileri yüklenirken hata:', error);
      return;
    }

    // Aktivite türlerini grupla
    const activityMap = new Map<string, number>();
    activitiesData?.forEach(activity => {
      const type = activity.activity_type;
      activityMap.set(type, (activityMap.get(type) || 0) + 1);
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f', '#ffbb28'];
    const stats: ActivityTypeStats[] = Array.from(activityMap.entries()).map(([type, count], index) => ({
      activityType: type,
      count,
      color: colors[index % colors.length]
    }));

    setActivityStats(stats.sort((a, b) => b.count - a.count));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${minutes}dk`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-pulse">Kullanıcı analizleri yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Kullanıcı Analizleri</h2>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold">{userActivities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Aktif Zaman</p>
                <p className="text-2xl font-bold">
                  {formatTime(userActivities.reduce((total, user) => total + user.totalActiveTime, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(userRevenues.reduce((total, user) => total + user.totalRevenue, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Aktivite</p>
                <p className="text-2xl font-bold">
                  {activityStats.reduce((total, stat) => total + stat.count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kullanıcı Aktivite Analizi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Kullanıcı Aktivite Analizi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Oturum Sayısı</TableHead>
                <TableHead>Toplam Aktif Zaman</TableHead>
                <TableHead>Ortalama Oturum</TableHead>
                <TableHead>Sayfa Görüntüleme</TableHead>
                <TableHead>Son Aktif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userActivities.map((user, index) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{user.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge>{user.totalSessions} oturum</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-blue-600">
                    {formatTime(user.totalActiveTime)}
                  </TableCell>
                  <TableCell>{formatTime(user.avgSessionDuration)}</TableCell>
                  <TableCell>{user.totalPageViews} görüntüleme</TableCell>
                  <TableCell className="text-sm">{user.lastActiveDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {userActivities.length === 0 && (
            <p className="text-gray-500 text-center py-4">Henüz kullanıcı aktivite verisi bulunmuyor.</p>
          )}
        </CardContent>
      </Card>

      {/* Kullanıcı Gelir Analizi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Kullanıcı Gelir Analizi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Toplam Sipariş</TableHead>
                <TableHead>Onaylanan</TableHead>
                <TableHead>Bekleyen</TableHead>
                <TableHead>Toplam Gelir</TableHead>
                <TableHead>Ortalama Sipariş</TableHead>
                <TableHead>Son Sipariş</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRevenues.map((user, index) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{user.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge>{user.totalOrders} sipariş</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{user.approvedOrders}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.pendingOrders}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(user.totalRevenue)}
                  </TableCell>
                  <TableCell>{formatCurrency(user.avgOrderValue)}</TableCell>
                  <TableCell className="text-sm">{user.lastOrderDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {userRevenues.length === 0 && (
            <p className="text-gray-500 text-center py-4">Henüz kullanıcı gelir verisi bulunmuyor.</p>
          )}
        </CardContent>
      </Card>

      {/* Aktivite Türü Dağılımı */}
      {activityStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Türü Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ activityType, percent }) => `${activityType} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {activityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktivite Sayıları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityStats.map((stat, index) => (
                  <div key={stat.activityType} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="font-medium">{stat.activityType}</span>
                    </div>
                    <Badge>{stat.count.toLocaleString()} aktivite</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserAnalyticsTab;