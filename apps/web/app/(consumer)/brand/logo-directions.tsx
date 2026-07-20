import Image from "next/image";
import { Badge, Card } from "@urnight/ui";

const FINAL_ASSETS = [
  {
    key: "wordmark",
    title: "Wordmark principal",
    description:
      "Uso en navegación, comunicación y superficies horizontales de marca.",
    src: "/brand/wordmark.png",
    width: 1168,
    height: 104,
    imageClassName: "h-auto w-full max-w-xl",
    usage: "Header, campañas y piezas editoriales",
    primary: true,
  },
  {
    key: "icon",
    title: "Icon mark",
    description:
      "La V angular y su haz de luz funcionan como firma compacta de RAVENUE.",
    src: "/brand/icon-mark.png",
    width: 632,
    height: 622,
    imageClassName: "size-32 object-contain sm:size-40",
    usage: "Favicon, avatar y app",
    primary: false,
  },
] as const;

/** Activos definitivos del sistema de marca. */
export function LogoDirections() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {FINAL_ASSETS.map((asset) => (
          <Card
            key={asset.key}
            className="flex h-full flex-col overflow-hidden"
          >
            <div className="flex min-h-56 items-center justify-center border-b bg-surface px-8 py-10">
              <Image
                src={asset.src}
                alt={asset.title}
                width={asset.width}
                height={asset.height}
                className={asset.imageClassName}
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold">
                  {asset.title}
                </h3>
                {asset.primary ? <Badge>Principal</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {asset.description}
              </p>
              <p className="mt-5 text-sm">
                <strong>Uso:</strong>{" "}
                <span className="text-muted-foreground">{asset.usage}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-5 rounded-md border border-accent-border bg-accent px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-[var(--rv-rose)]">Archivo histórico:</strong> la
        identidad final sintetiza las direcciones elegidas D1 (wordmark) y D3
        (símbolo compacto).
      </p>
    </>
  );
}
