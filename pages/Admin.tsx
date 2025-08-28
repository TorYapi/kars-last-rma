
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminPanel from './AdminPanel';

const Admin = () => {
  return (
    <ProtectedRoute adminOnly>
      <AdminPanel />
    </ProtectedRoute>
  );
};

export default Admin;
