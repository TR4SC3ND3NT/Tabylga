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
  region: MapRegion;
  initialRegion: MapRegion;
  pinColors: Record<string, string>;
  routePointsLabel?: string;
  routeMoreLabel?: string;
  onSelectPlace: (place: Place) => void;
}
