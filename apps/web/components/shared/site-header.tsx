import { SearchSuggest } from '@/components/catalog/search-suggest';
import { Logo } from './logo';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

/** Cabecera del sitio público. Server Component con islas cliente para sesión/tema. */
export function SiteHeader() {
  return (
    /* Navbar DS: fill oscuro translúcido + blur, hairline inferior. */
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Logo />
        </div>
        <MainNav className="hidden md:flex" />
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">
            {/* Buscador con sugerencias en vivo (eventos + locales). */}
            <SearchSuggest placeholder="Buscar eventos, locales…" />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
