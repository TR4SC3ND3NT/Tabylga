import { type DimensionValue, ImageBackground, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors } from '../constants/colors';

interface PlacePhotoProps {
  imageUrl?: string;
  tint: string;
  width: DimensionValue;
  height: number;
  radius?: number;
  label?: string;
}

export function PlacePhoto({ imageUrl, tint, width, height, radius = 0, label }: PlacePhotoProps) {
  const content = (
    <>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: imageUrl ? 'rgba(17,24,28,0.48)' : tint,
        }}
      />
      {!imageUrl && <MapPin size={24} color="#fff" strokeWidth={1.8} />}
      {label && (
        <View
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            paddingHorizontal: 8,
            height: 22,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: colors.brand.primary }}>
            {label}
          </Text>
        </View>
      )}
    </>
  );

  if (!imageUrl) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: radius,
          backgroundColor: tint,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: imageUrl }}
      imageStyle={{ borderRadius: radius }}
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tint,
      }}
    >
      {content}
    </ImageBackground>
  );
}
