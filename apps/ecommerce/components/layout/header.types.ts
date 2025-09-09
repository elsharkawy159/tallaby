export interface HeaderProps {
  className?: string;
}

export interface LogoProps {
  className?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: "mobile" | "desktop";
}

export interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
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
