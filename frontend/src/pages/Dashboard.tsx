import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard"
import { PermissionGuard } from "@/components/PermissionGuard"

const Dashboard = () => {
  return (
    <PermissionGuard pageId={1}>
      <EnhancedDashboard />
    </PermissionGuard>
  );
}

export default Dashboard
