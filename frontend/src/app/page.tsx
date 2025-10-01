import Image from "next/image";
import { WalletPanel } from "@/components/WalletPanel";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-6">ShadowNet Xverse Integration</h1>
      <WalletPanel />
    </div>
  );
}
