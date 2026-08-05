"use client";

import { QrCode as QrIcon } from "@phosphor-icons/react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { StorageImage } from "@/lib/storage/storage-context";

interface BrandQrProps {
  value: string;
  alt: string;
  imageKey?: string | null;
  size?: number;
}

function QrFrame({
  children,
  size,
}: {
  children: ReactNode;
  size: number;
}) {
  return (
    <div
      className="relative aspect-square shrink-0 overflow-hidden rounded-xl bg-white p-1.5"
      style={{ width: size, height: size }}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="relative aspect-square w-1/5 overflow-hidden rounded-lg border border-black/10 bg-white p-0.5 shadow-sm">
          <Image
            src="/brand/icon-mark-light.png"
            alt=""
            fill
            sizes={`${Math.ceil(size * 0.2)}px`}
            className="object-contain p-0.5"
          />
        </span>
      </div>
    </div>
  );
}

/** QR escaneable con el raven de RAVENUE centrado y corrección de nivel H. */
export function BrandQr({
  value,
  alt,
  imageKey = null,
  size = 160,
}: BrandQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageKey) return;
    let active = true;
    setDataUrl(null);
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        /* El valor en texto sigue disponible como respaldo. */
      });
    return () => {
      active = false;
    };
  }, [imageKey, size, value]);

  if (imageKey) {
    return (
      <QrFrame size={size}>
        <StorageImage
          src={imageKey}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      </QrFrame>
    );
  }

  if (dataUrl) {
    return (
      <QrFrame size={size}>
        <Image
          src={dataUrl}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-contain"
        />
      </QrFrame>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="flex aspect-square shrink-0 items-center justify-center rounded-xl border bg-muted"
      style={{ width: size, height: size }}
    >
      <QrIcon
        aria-hidden="true"
        className="h-10 w-10 text-muted-foreground"
        weight="duotone"
      />
    </div>
  );
}
