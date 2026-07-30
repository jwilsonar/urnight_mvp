import { getTranslations } from "next-intl/server";
import { SearchSuggest } from "@/components/catalog/search-suggest";
import { HideOnScrollHeader } from "@/components/motion/hide-on-scroll-header";
import { Logo3D } from "./logo-3d";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { NotificationBellConsumer } from "./notification-bell-consumer";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** Cabecera del sitio público. Server Component con islas cliente para sesión/tema. */
export async function SiteHeader() {
  const t = await getTranslations("search");

  return (
    /* Navbar DS: fill oscuro casi opaco + blur, hairline inferior. El 95% evita
       que el contenido al scrollear se lea a través y ensucie la navegación. */
    <HideOnScrollHeader>
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-4 xl:px-8">
        <div
          className="flex shrink-0 items-center gap-3 xl:gap-4"
          data-header-brand-nav
        >
          <div className="flex shrink-0 items-center gap-2">
            <MobileNav />
            {/* En reposo coincide con el logo plano. La profundidad y el brillo
                aparecen solo al interactuar con la marca. */}
            <Logo3D />
          </div>
          <MainNav className="hidden shrink-0 lg:flex" />
        </div>
        <div aria-hidden="true" className="min-w-4 flex-1" />
        <div
          className="hidden w-48 min-w-40 shrink lg:block xl:w-72 xl:shrink-0"
          data-header-search
        >
          {/* Buscador con sugerencias en vivo (eventos + locales). */}
          <SearchSuggest placeholder={t("placeholder")} />
        </div>
        <div
          className="ml-3 flex shrink-0 items-center gap-1 lg:ml-3 xl:ml-4"
          data-header-actions
        >
          <ThemeToggle />
          <NotificationBellConsumer />
          <UserMenu />
        </div>
      </div>
    </HideOnScrollHeader>
  );
}
