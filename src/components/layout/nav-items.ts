import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    label: 'Início',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Familiares',
    href: '/familiares',
    icon: Users,
  },
  {
    label: 'Médicos',
    href: '/medicos',
    icon: Stethoscope,
  },
  {
    label: 'Consultas',
    href: '/consultas',
    icon: CalendarCheck,
  },
  {
    label: 'Exames',
    href: '/exames',
    icon: FileText,
  },
];

export { LayoutDashboard, Users, Stethoscope, CalendarCheck, FileText };
