"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      // First letter of first name and first letter of last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      // Only one name, use first two letters
      return nameParts[0].substring(0, 2).toUpperCase();
    }
  }

  // Fallback to email
  if (email) {
    return email[0].toUpperCase();
  }

  // Final fallback
  return "U";
}

export function UserAvatar({ name, email }: UserAvatarProps) {
  const initials = getInitials(name, email);
  const displayName = name || email || "Usuario";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        aria-label="User menu"
      >
        {initials}
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-56 p-2">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          {email && name && (
            <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
          )}
        </div>
        <div className="border-t border-border mt-2 pt-2 space-y-1">
          <Link href="/mis-datos" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Mis datos
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
