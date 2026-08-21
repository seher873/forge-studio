import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magic.AI",
};

export default function WrapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
