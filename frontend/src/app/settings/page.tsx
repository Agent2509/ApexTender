import { UserProfile } from "@clerk/nextjs";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 flex justify-center">
        <UserProfile />
      </div>
    </DashboardLayout>
  );
}
