import { useTranslations } from "next-intl";
import { BrandQr } from "@/components/shared/brand-qr";

/**
 * QR de una entrada. Preferimos el PNG ya guardado en S3 (`qrImageKey`,
 * resuelto a URL en presentación). Si aún no se generó —subida best-effort en el
 * checkout—, lo renderizamos en el cliente a partir del token `qrCode`, que es la
 * fuente de verdad que valida la puerta. Ambos codifican el mismo token, así que
 * el escaneo funciona igual venga de donde venga.
 */
export function TicketQr({
  qrImageKey,
  qrCode,
  size = 160,
}: {
  qrImageKey: string | null;
  qrCode: string;
  size?: number;
}) {
  const t = useTranslations("tickets.qr");
  return (
    <BrandQr
      value={qrCode}
      imageKey={qrImageKey}
      alt={t("alt")}
      size={size}
    />
  );
}
