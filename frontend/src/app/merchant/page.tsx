import { MerchantPanel } from "@/components/MerchantPanel";

export default function MerchantPage() {
  return (
    <div className="min-h-screen py-10">
      <h1 className="text-3xl font-semibold mb-6">Merchant Dashboard</h1>
      <MerchantPanel />
    </div>
  );
}
