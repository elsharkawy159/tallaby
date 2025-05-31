// import { signOutAction } from "@/app/actions";
// import Link from "next/link";
// import { Badge } from "@workspace/ui/components/badge";
// import { Button } from "@workspace/ui/components/button";
// import { createClient } from "@/db/supabase/server";

// export default async function AuthButton() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   return user ? (
//     <div className="flex items-center gap-4">
//       Hey, {user.email}!
//       <form action={signOutAction}>
//         <Button type="submit" variant={"outline"}>
//           Sign out
//         </Button>
//       </form>
//     </div>
//   ) : (
//     <div className="flex gap-2">
//       <Button asChild size="sm" variant={"outline"}>
//         <Link href="/sign-in">Sign in</Link>
//       </Button>
//       <Button asChild size="sm" variant={"default"}>
//         <Link href="/sign-up">Sign up</Link>
//       </Button>
//     </div>
//   );
// }
