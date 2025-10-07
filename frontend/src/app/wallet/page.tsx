import { WalletPanel } from "@/components/WalletPanel";

export default function WalletPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-10">
      <h1 className="text-3xl font-semibold mb-6">Wallet</h1>
      <WalletPanel />
    </div>
  );
}


