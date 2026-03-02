import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import {
  fetchAutoLocationFromWttr,
  fetchWttrLine,
  normalizeCityName,
  stripCityPrefix,
} from "@/api/weather/wttr.api";

type UseWardrobeWeatherResult = {
  city: string | null;
  weatherLine: string | null;
  loading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
};

const WEATHER_LOAD_ERROR = "Weather unavailable right now.";

function pickCityFromAddress(address: Location.LocationGeocodedAddress | undefined): string | null {
  if (!address) {
    return null;
  }

  const cityCandidate =
    address.city ??
    address.district ??
    address.subregion ??
    address.region ??
    null;

  if (!cityCandidate?.trim()) {
    return null;
  }

  return normalizeCityName(cityCandidate);
}

function cityFromTimeZone(): string | null {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timeZone?.trim()) {
    return null;
  }

  const rawCity = timeZone.split("/").pop();
  if (!rawCity) {
    return null;
  }

  return normalizeCityName(rawCity.replace(/_/g, " "));
}

async function resolveCityFromGps(): Promise<string | null> {
  let permission = await Location.getForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    return null;
  }

  const currentLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const addresses = await Location.reverseGeocodeAsync({
    latitude: currentLocation.coords.latitude,
    longitude: currentLocation.coords.longitude,
  });

  for (const address of addresses) {
    const city = pickCityFromAddress(address);
    if (city) {
      return city;
    }
  }

  return null;
}

export function useWardrobeWeather(): UseWardrobeWeatherResult {
  const [city, setCity] = useState<string | null>(null);
  const [weatherLine, setWeatherLine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef<Promise<void> | null>(null);
  const cityRef = useRef<string | null>(null);
  const permissionPromptedRef = useRef(false);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  const refreshWeather = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const task = (async () => {
      setLoading(true);
      setError(null);

      try {
        let gpsCity: string | null = null;
        try {
          const permission = await Location.getForegroundPermissionsAsync();
          if (permission.status === Location.PermissionStatus.GRANTED) {
            gpsCity = await resolveCityFromGps();
          } else if (
            permission.status === Location.PermissionStatus.UNDETERMINED &&
            !permissionPromptedRef.current
          ) {
            permissionPromptedRef.current = true;
            gpsCity = await resolveCityFromGps();
          }
        } catch {
          gpsCity = null;
        }

        const inferredCity = cityFromTimeZone();

        let finalCity = gpsCity ?? cityRef.current ?? inferredCity;

        if (!finalCity) {
          const fallback = await fetchAutoLocationFromWttr();
          finalCity = fallback.city;
        }

        if (!finalCity) {
          throw new Error("Unable to resolve city");
        }

        const weather = await fetchWttrLine(finalCity);
        setCity(normalizeCityName(finalCity));
        setWeatherLine(stripCityPrefix(weather, finalCity));
      } catch (err) {
        setError(WEATHER_LOAD_ERROR);
      } finally {
        setLoading(false);
      }
    })();

    inFlightRef.current = task;
    try {
      await task;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  return {
    city,
    weatherLine,
    loading,
    error,
    refreshWeather,
  };
}
