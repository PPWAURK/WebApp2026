import type { MenuPage } from '../types/menu';

export function normalizePathname(pathname: string): string {
  const lower = pathname.toLowerCase();
  const withLeadingSlash = lower.startsWith('/') ? lower : `/${lower}`;

  if (withLeadingSlash.length <= 1) {
    return '/';
  }

  return withLeadingSlash.replace(/\/+$/, '');
}

export function pathnameToMenuPage(pathname: string): MenuPage | null {
  const normalized = normalizePathname(pathname);

  if (normalized === '/team-overview') {
    return 'teamOverview';
  }

  if (normalized === '/profile') {
    return 'profile';
  }

  if (normalized === '/training') {
    return 'training';
  }

  if (normalized === '/restaurant-forms') {
    return 'restaurantForms';
  }

  if (normalized === '/store-management') {
    return 'storeManagement';
  }

  if (normalized === '/orders') {
    return 'orders';
  }

  if (normalized === '/order-recap') {
    return 'orderRecap';
  }

  if (normalized === '/order-history') {
    return 'orderHistory';
  }

  if (normalized === '/supplier-management') {
    return 'supplierManagement';
  }

  if (normalized === '/dashboard') {
    return 'dashboard';
  }

  return null;
}

export function menuPageToPath(page: MenuPage): string {
  if (page === 'teamOverview') {
    return '/team-overview';
  }

  if (page === 'profile') {
    return '/profile';
  }

  if (page === 'training') {
    return '/training';
  }

  if (page === 'restaurantForms') {
    return '/restaurant-forms';
  }

  if (page === 'storeManagement') {
    return '/store-management';
  }

  if (page === 'orders') {
    return '/orders';
  }

  if (page === 'orderRecap') {
    return '/order-recap';
  }

  if (page === 'orderHistory') {
    return '/order-history';
  }

  if (page === 'supplierManagement') {
    return '/supplier-management';
  }

  return '/dashboard';
}
