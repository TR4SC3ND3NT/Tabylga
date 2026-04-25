import { Platform } from 'react-native';
import { View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import type { MapCanvasProps } from './MapCanvas.types';

export function MapCanvas({
  places,
  routePlaces = [],
  region,
  initialRegion,
  pinColors,
  onSelectPlace,
}: MapCanvasProps) {
  const routeCoordinates = routePlaces.map((place) => ({ latitude: place.lat, longitude: place.lon }));

  return (
    <MapView
      style={{ position: 'absolute', inset: 0 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
      region={region}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {routeCoordinates.length > 1 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#D9822B"
          strokeWidth={4}
          lineDashPattern={[8, 5]}
        />
      )}

      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={{ latitude: place.lat, longitude: place.lon }}
          title={place.name}
          description={`${place.category} · ${place.region}`}
          pinColor={pinColors[place.category]}
          onPress={() => onSelectPlace(place)}
        />
      ))}

      {routePlaces.map((place, index) => (
        <Marker
          key={`route_${place.id}`}
          coordinate={{ latitude: place.lat, longitude: place.lon }}
          title={`${index + 1}. ${place.name}`}
          description={`${place.category} · ${place.region}`}
          onPress={() => onSelectPlace(place)}
          zIndex={100 + index}
        >
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#D9822B', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>
              {index + 1}
            </Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
