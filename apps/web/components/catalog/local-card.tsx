import { SealCheck } from '@phosphor-icons/react/dist/ssr';
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
      {/* Card clickeable DS: lift 2px + borde amatista + sombra al hover. */}
      <Card className="h-full overflow-hidden group-hover:-translate-y-0.5 group-hover:border-accent-border group-hover:shadow-float">
        <div className="relative aspect-[4/3]">
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
          {local.isVerified ? (
            <Badge variant="success" className="absolute right-2 top-2 gap-1">
              <SealCheck className="h-3 w-3" weight="fill" /> Verificado
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-heading text-[17px] font-bold leading-tight">{local.name}</h3>
          {local.address ? <p className="line-clamp-1 text-sm text-muted-foreground">{local.address}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
