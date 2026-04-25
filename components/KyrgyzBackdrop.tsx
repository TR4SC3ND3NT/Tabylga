import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export function KyrgyzBackdrop({ height = 260 }: { height?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        backgroundColor: '#DDE8EA',
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CFE5EC" />
            <Stop offset="0.58" stopColor="#F2DFC7" />
            <Stop offset="1" stopColor="#F7F6F2" />
          </LinearGradient>
          <LinearGradient id="ridge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1E4D6B" stopOpacity="0.98" />
            <Stop offset="1" stopColor="#4A6B40" stopOpacity="0.98" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0H390V260H0Z" fill="url(#sky)" />
        <Circle cx="314" cy="56" r="30" fill="#D4A574" opacity="0.84" />
        <Path
          d="M0 158L42 118L82 145L126 82L164 139L203 103L246 151L296 89L344 142L390 104V260H0V158Z"
          fill="url(#ridge)"
          opacity="0.88"
        />
        <Path
          d="M0 190L60 152L110 180L158 132L210 184L266 145L318 182L390 137V260H0V190Z"
          fill="#6A7B52"
          opacity="0.84"
        />
        <Path d="M0 218C78 203 142 207 202 224C270 243 326 233 390 210V260H0V218Z" fill="#F7F6F2" />
      </Svg>
    </View>
  );
}
