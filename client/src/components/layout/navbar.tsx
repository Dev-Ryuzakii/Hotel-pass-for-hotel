import { BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  return (
    <div className="bg-white border-b w-full sticky top-0">
      <div className="px-8 py-4 flex justify-end items-center gap-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <BellDot className="h-5 w-5" />
            {/* Red notification dot */}
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
          </Button>
        </div>
        <Avatar>
          <AvatarFallback>AA</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
