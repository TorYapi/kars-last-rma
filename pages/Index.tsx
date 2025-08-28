import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Package, ShoppingCart, Upload, Users, Shield, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, signOut } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/c7bf07af-f8ab-4f3c-b5ef-141bdf21c35a.png" alt="TOR Logo" className="h-12 w-12 object-contain" style={{backgroundColor: 'transparent', filter: 'brightness(0.7) contrast(1.2)'}} />
              <h1 className="text-2xl font-bold text-gray-900">TORRX</h1>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Hoş geldiniz, {getUserDisplayName()}
                  </span>
                  {profile?.role === 'admin' ? (
                    <>
                      <Link to="/admin">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                      <Link to="/admin" className="sm:hidden">
                        <Button variant="outline" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Users className="h-4 w-4 mr-2" />
                          Panelim
                        </Button>
                      </Link>
                      <Link to="/dashboard" className="sm:hidden">
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                    Çıkış
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut} className="sm:hidden">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Ürün ve Sipariş Yönetimi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Excel dosyalarınızı yükleyin, ürünleri yönetin ve siparişleri kolayca takip edin.
            {!user && " Başlamak için giriş yapın."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-6 w-6 mr-3 text-blue-600" />
                Ürün Yükleme
              </CardTitle>
              <CardDescription>
                Excel dosyalarından ürün verilerini kolayca sisteme aktarın
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && profile?.role === 'admin' ? (
                <Link to="/upload">
                  <Button className="w-full">
                    Ürün Yükle
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  {!user ? "Giriş Gerekli" : "Admin Yetkisi Gerekli"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-6 w-6 mr-3 text-green-600" />
                Ürün Kataloğu
              </CardTitle>
              <CardDescription>
                Mevcut ürünleri görüntüleyin ve sepete ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/products">
                <Button className="w-full" variant="outline">
                  Ürünleri İncele
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-6 w-6 mr-3 text-purple-600" />
                Sepet ve Siparişler
              </CardTitle>
              <CardDescription>
                Sepetinizi yönetin ve sipariş verin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/cart">
                <Button className="w-full" variant="outline">
                  Sepeti Görüntüle
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {user && (
          <div className="text-center">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Hesap Bilgileriniz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Ad Soyad:</strong> {getUserDisplayName()}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rol:</strong> {profile?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</p>
                  <div className="pt-4">
                    {profile?.role === 'admin' ? (
                      <Link to="/admin">
                        <Button className="mr-2">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Paneli
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/dashboard">
                        <Button className="mr-2">
                          <Users className="h-4 w-4 mr-2" />
                          Kullanıcı Paneli
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!user && (
          <div className="text-center">
            <Card className="max-w-lg mx-auto border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Hemen Başlayın!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Sistemi kullanmak için bir hesap oluşturun veya mevcut hesabınızla giriş yapın.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Giriş Yap / Kayıt Ol
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
