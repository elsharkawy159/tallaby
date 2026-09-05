export interface HeaderProps {
  className?: string;
}

export interface ScrollingHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface LogoProps {
  className?: string;
  logoClassName?: string;
  color?: "white" | "primary" | "secondary";
}

export interface SearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: "mobile" | "desktop";
}

export type BottomNavIcon = "home" | "shopping" | "cart";

export interface NavigationItem {
  href: string;
  label: string;
  icon?: BottomNavIcon;
}

export interface MobileNavigationProps {
  className?: string;
}

export interface DesktopNavigationProps {
  className?: string;
}

export interface UserAuthProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export interface BottomNavigationProps {
  className?: string;
}
