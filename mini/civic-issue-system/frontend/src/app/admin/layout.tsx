"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CopyCheck, ShieldAlert, Users, Settings, LogOut, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Check if user is admin on mount
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      // TEMPORARY: Allow access for testing - remove this block in production
      console.log('Accessing admin with role:', user.role);
    }
  }, [user, router]);

  // Show loading or redirect if not admin
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-8">
          <Shield size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-foreground/60 mb-4">You don&apos;t have permission to access this area.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: "Overview", href: "/admin", icon: <ShieldAlert size={20} /> },
    { name: "Verify Issues", href: "/admin/verify", icon: <CopyCheck size={20} /> },
    { name: "Departments", href: "/admin/departments", icon: <Users size={20} /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar Navigation */}
      <nav className="w-64 glass m-4 border-r border-white/20 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            Civic<span className="text-foreground">Admin</span>
          </h2>
        </div>

        <ul className="flex-1 px-4 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link href={link.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-foreground/70 hover:bg-white/40 hover:text-foreground"
                    }`}
                  >
                    {link.icon}
                    <span className="font-medium">{link.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Profile */}
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 bg-white/30  rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user?.name || "Admin"}</p>
              <p className="text-xs text-foreground/60">Administrator</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/auth/login'); }} className="flex items-center gap-2 px-4 py-2 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
         {children}
      </main>
    </div>
  );
}
