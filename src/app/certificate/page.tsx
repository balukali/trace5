import type { Metadata } from "next";
import { CertificateView } from "@/components/certificate-view";

export const metadata: Metadata = {
  title: "Certificate",
  description: "Your print-friendly TRACE//5 Cybersecurity Investigator certificate.",
};

export default function CertificatePage() {
  return <CertificateView />;
}
