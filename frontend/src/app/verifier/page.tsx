import { VerifierPanel } from "@/components/VerifierPanel";

export default function VerifierPage() {
  return (
    <div className="h-screen py-10">
      <h1 className="text-3xl font-semibold flex items-center justify-center text-white">Proof Verifier</h1>
      <VerifierPanel />
    </div>
  );
}
