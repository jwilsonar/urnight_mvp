import { MapPin, SealCheck } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { LocalResponse } from '@urnight/contracts';
import { Badge, Card, CardContent } from '@urnight/ui';
import { Tilt } from '@/components/motion/tilt';
import { StorageImage } from '@/lib/storage/storage-context';

export function LocalCard({ local }: { local: LocalResponse }) {
  return (
    <Link
      href={`/locals/${local.slug}`}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Card clickeable con tilt 3D siguiendo el puntero + borde/sombra al hover. */}
      <Tilt className="h-full rounded-lg">
      <Card className="h-full overflow-hidden group-hover:border-accent-border group-hover:shadow-float">
        <div className="un-zoom-img relative aspect-[4/3] overflow-hidden">
          {local.mainImageUrl ? (
            <StorageImage
              src={local.mainImageUrl}
              alt={local.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="un-img-ph absolute inset-0">
              <span>Fachada del local</span>
            </div>
          )}
          {/* Pill de estado arriba-izquierda, como la venue card del prototipo. */}
          {local.isVerified ? (
            <Badge
              variant="success"
              className="absolute left-2 top-2 gap-1 bg-deep/90 backdrop-blur-sm"
            >
              <SealCheck className="h-3 w-3" weight="fill" /> Verificado
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1.5 p-4">
          <h3 className="line-clamp-1 font-heading text-[17px] font-bold leading-tight">{local.name}</h3>
          {local.address ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" weight="duotone" />
              <span className="line-clamp-1">{local.address}</span>
            </p>
          ) : null}
          {local.description ? (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/80">
              {local.description}
            </p>
          ) : null}
        </CardContent>
      </Card>
      </Tilt>
    </Link>
  );
}
