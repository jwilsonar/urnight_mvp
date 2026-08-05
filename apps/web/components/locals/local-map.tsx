"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { MapPin } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface LocalMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

/** Mapa con el pin del local (Google Maps). Degrada si falta la API key. */
export function LocalMap({ latitude, longitude, name }: LocalMapProps) {
  const t = useTranslations("locals.detail");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const position = { lat: latitude, lng: longitude };

  if (!apiKey) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-muted-foreground">
        <MapPin className="h-8 w-8" weight="duotone" />
        <p className="text-sm">{t("mapUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-lg border">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={position}
          defaultZoom={15}
          gestureHandling="cooperative"
          disableDefaultUI
        >
          <Marker position={position} title={name} />
        </Map>
      </APIProvider>
    </div>
  );
}
