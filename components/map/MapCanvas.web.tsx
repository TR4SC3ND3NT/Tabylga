import React from 'react';
import { View, Text } from 'react-native';
import type { MapCanvasProps } from './MapCanvas.types';

export function MapCanvas({
  places,
  selectedPlace,
  routePlaces = [],
  region,
  initialRegion,
  routePointsLabel = 'Route points',
  routeMoreLabel,
}: MapCanvasProps) {
  const center = selectedPlace ?? routePlaces[0] ?? places[0];
  const latitude = center?.lat ?? region.latitude ?? initialRegion.latitude;
  const longitude = center?.lon ?? region.longitude ?? initialRegion.longitude;
  const delta = selectedPlace ? 0.08 : Math.max(region.latitudeDelta, 0.4);
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: '#DDE6DD' }}>
      {React.createElement('iframe' as any, {
        src,
        title: 'Tabylga map',
        style: { width: '100%', height: '100%', border: 0 },
      })}
      {routePlaces.length > 1 && (
        <View style={{ position: 'absolute', right: 16, top: 136, width: 150, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.94)', padding: 10, gap: 6 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#2A2922' }}>
            {routePointsLabel}
          </Text>
          {routePlaces.slice(0, 4).map((place, index) => (
            <Text key={place.id} numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#5B5A52' }}>
              {index + 1}. {place.name}
            </Text>
          ))}
          {routePlaces.length > 4 && (
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#8A8678' }}>
              {routeMoreLabel ?? `+${routePlaces.length - 4} more`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
