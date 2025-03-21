import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, Menu, Wallet, Bed } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Rooms", href: "/rooms", icon: Bed },
  { name: "Revenue", href: "/revenue", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks() {
  const [location] = useLocation();

  return (
    <nav className="flex flex-1 flex-col pt-4">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <p className="text-sm font-medium text-gray-400 mb-2 py-3">DASHBOARD</p>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      location === item.href
                        ? "bg-gray-50 text-primary"
                        : "text-gray-700 hover:text-primary hover:bg-gray-50",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hotel Manager</h1>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Hotel Manager</h1>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <div className="flex grow flex-col gap-y-7 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-2">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Hotel Manager</h1>
          </div>
          <NavLinks />
        </div>
      </div>
    </>
  );
}