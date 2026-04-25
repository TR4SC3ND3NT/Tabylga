import { Platform, View, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Bed,
  Building2,
  Coffee,
  Landmark,
  MapPin,
  Mountain,
  ShoppingBag,
  TreePine,
  Trees,
  Utensils,
  WalletCards,
} from 'lucide-react-native';
import type { MapCanvasProps } from './MapCanvas.types';

const CATEGORY_ICONS: Record<string, any> = {
  hotel: Bed,
  hostel: Bed,
  yurt: Building2,
  guesthouse: Bed,
  restaurant: Utensils,
  cafe: Coffee,
  activity: Mountain,
  attraction: Landmark,
  nature: Trees,
  market: ShoppingBag,
  park: TreePine,
  rest_point: MapPin,
  atm: WalletCards,
};

export function MapCanvas({
  places,
  routePlaces = [],
  navigationCoordinates = [],
  region,
  initialRegion,
  pinColors,
  onSelectPlace,
}: MapCanvasProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 350);
    }
  }, [region]);

  const routeCoordinates = routePlaces.map((place) => ({ latitude: place.lat, longitude: place.lon }));
  const visibleRoute = navigationCoordinates.length > 1 ? navigationCoordinates : routeCoordinates;

  return (
    <MapView
      ref={mapRef}
      style={{ position: 'absolute', inset: 0 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {visibleRoute.length > 1 && (
        <Polyline
          coordinates={visibleRoute}
          strokeColor="#C65D3A"
          strokeWidth={5}
        />
      )}

      {places.map((place) => {
        const Icon = CATEGORY_ICONS[place.category] ?? MapPin;
        const color = pinColors[place.category] ?? '#1E4D6B';

        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            title={place.name}
            description={`${place.category} · ${place.region}`}
            onPress={() => onSelectPlace(place)}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} color="#fff" strokeWidth={2.2} />
            </View>
          </Marker>
        );
      })}

      {routePlaces.map((place, index) => (
        <Marker
          key={`route_${place.id}`}
          coordinate={{ latitude: place.lat, longitude: place.lon }}
          title={`${index + 1}. ${place.name}`}
          description={`${place.category} · ${place.region}`}
          onPress={() => onSelectPlace(place)}
          zIndex={100 + index}
        >
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#C65D3A', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>
              {index + 1}
            </Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
