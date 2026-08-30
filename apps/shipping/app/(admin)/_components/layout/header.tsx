import { UserMenu } from "./user-menu";

interface HeaderProps {
  name: string;
  email: string;
}

export function Header({ name, email }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-semibold">Shipping</span>
      </div>
      <div className="ml-auto">
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
