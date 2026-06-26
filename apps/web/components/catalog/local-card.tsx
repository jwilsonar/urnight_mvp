import { MapPin, SealCheck } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { LocalResponse } from '@urnight/contracts';
import { Badge, Card, CardContent } from '@urnight/ui';
import { StorageImage } from '@/lib/storage/storage-context';

export function LocalCard({ local }: { local: LocalResponse }) {
  return (
    <Link
      href={`/locals/${local.slug}`}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full overflow-hidden transition-colors group-hover:border-primary">
        <div className="relative aspect-[4/3] bg-muted">
          {local.mainImageUrl ? (
            <StorageImage
              src={local.mainImageUrl}
              alt={local.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <MapPin className="h-10 w-10" weight="duotone" />
            </div>
          )}
          {local.isVerified ? (
            <Badge variant="success" className="absolute right-2 top-2 gap-1">
              <SealCheck className="h-3 w-3" weight="fill" /> Verificado
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-heading font-semibold leading-tight">{local.name}</h3>
          {local.address ? <p className="line-clamp-1 text-sm text-muted-foreground">{local.address}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
