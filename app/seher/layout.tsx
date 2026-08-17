import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seher Agent",
};

export default function WrapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
