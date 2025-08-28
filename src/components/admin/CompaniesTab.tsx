
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompaniesTabProps {
  companies: string[];
  onCompanyClick: (companyName: string) => void;
}

const CompaniesTab = ({ companies, onCompanyClick }: CompaniesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Firma İletişim Bilgileri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card 
              key={company} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onCompanyClick(company)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{company}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  İletişim bilgilerini görüntülemek için tıklayın
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {companies.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Henüz firma bilgisi bulunmuyor.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompaniesTab;
