import { VerifierPanel } from "@/components/VerifierPanel";

export default function VerifierPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-10">
      <h1 className="text-3xl font-semibold mb-6">Proof Verifier</h1>
      <VerifierPanel />
    </div>
  );
}
