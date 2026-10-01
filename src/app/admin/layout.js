import Link from "next/link";

import AdminWallet from "@/components/AdminWallet";
import AdminGuard from "@/components/AdminGuard";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Upload NFT", href: "/admin/upload" },
  { label: "Batch Upload", href: "/admin/batch-upload" },
  { label: "NFT Library", href: "/admin/nfts" },
  { label: "Mint Controls", href: "/admin/mint" },
  { label: "Reserved Mint", href: "/admin/reserved" },
  { label: "Revenue", href: "/admin/revenue" },
];

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#11110f] text-[#f5f0d7]">
        <div className="flex min-h-screen">
          <aside className="w-64 border-r border-[#3a392f] bg-[#181814] p-6">
            <div className="mb-10">
              <h1 className="text-2xl font-bold tracking-wide">
                SOAPPY MINERS
              </h1>
              <p className="mt-1 text-sm text-[#9f9b83]">
                Admin Control Panel
              </p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-sm hover:bg-[#2a2922]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10">
              <AdminWallet />
            </div>
          </aside>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
