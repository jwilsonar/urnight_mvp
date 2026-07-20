import { SearchSuggest } from '@/components/catalog/search-suggest';
import { Logo3D } from './logo-3d';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { NotificationBellConsumer } from './notification-bell-consumer';
import { UserMenu } from './user-menu';

/** Cabecera del sitio público. Server Component con islas cliente para sesión/tema. */
export function SiteHeader() {
  return (
    /* Navbar DS: fill oscuro casi opaco + blur, hairline inferior. El 95% evita
       que el contenido al scrollear se lea a través y ensucie la navegación. */
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <MobileNav />
          {/* Variante 3D solo en el navbar público: la marca se inclina con el
              puntero y enciende al cargar. En checkout, auth y paneles se queda
              el <Logo/> plano — ahí un logo que brilla es distracción. */}
          <Logo3D />
        </div>
        <MainNav className="hidden md:flex" />
        {/* En lg+, los `auto` a ambos lados centran el clúster buscador+campana+
            avatar entre el logo/nav y el borde derecho: buscador más al centro y
            perfil cerca de él (§ feedback), sin hueco muerto a la derecha. */}
        <div className="hidden w-64 lg:block xl:w-72 lg:ml-auto">
          {/* Buscador con sugerencias en vivo (eventos + locales). */}
          <SearchSuggest placeholder="Buscar eventos, locales…" />
        </div>
        <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:mr-auto">
          <NotificationBellConsumer />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
