import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/user-avatar";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Don't render if no user is logged in
  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || null;
  const userEmail = user.email || null;

  return (
    <header className="fixed top-4 right-4 z-50">
      <UserAvatar name={userName} email={userEmail} />
    </header>
  );
}
