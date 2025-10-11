import { MerchantPanel } from "@/components/MerchantPanel";

export default function MerchantPage() {
  return (
    <div className="h-screen  py-10">
      <h1 className="text-3xl font-semibold flex items-center justify-center text-white">Merchant Dashboard</h1>
      <MerchantPanel />
    </div>
  );
}
