import type { Place } from '../../lib/api/places';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapCanvasProps {
  places: Place[];
  selectedPlace: Place | null;
  routePlaces?: Place[];
  navigationCoordinates?: Array<{ latitude: number; longitude: number }>;
  region: MapRegion;
  initialRegion: MapRegion;
  pinColors: Record<string, string>;
  routePointsLabel?: string;
  routeMoreLabel?: string;
  onSelectPlace: (place: Place) => void;
}
