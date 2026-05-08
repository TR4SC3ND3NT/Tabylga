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
        backgroundColor: '#DDF0FF',
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#B7E5FF" />
            <Stop offset="0.45" stopColor="#FFE5B0" />
            <Stop offset="1" stopColor="#F4F7FB" />
          </LinearGradient>
          <LinearGradient id="ridge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1368F2" stopOpacity="0.96" />
            <Stop offset="1" stopColor="#18C8B8" stopOpacity="0.96" />
          </LinearGradient>
        </Defs>
        <Path d="M0 0H390V260H0Z" fill="url(#sky)" />
        <Circle cx="318" cy="54" r="29" fill="#FFD166" opacity="0.94" />
        <Path d="M19 52C55 42 84 45 114 56" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" opacity="0.34" />
        <Path d="M245 91C281 80 313 84 350 97" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity="0.26" />
        <Path
          d="M0 155L41 112L82 143L127 74L165 138L203 97L246 150L296 84L344 138L390 100V260H0V155Z"
          fill="url(#ridge)"
          opacity="0.9"
        />
        <Path
          d="M0 190L58 150L111 178L157 132L210 183L266 144L318 181L390 136V260H0V190Z"
          fill="#FF4F7B"
          opacity="0.76"
        />
        <Path d="M0 214C74 199 139 205 202 222C270 241 326 232 390 207V260H0V214Z" fill="#F4F7FB" />
        <Path d="M28 228C74 221 112 223 155 234" stroke="#18C8B8" strokeWidth="6" strokeLinecap="round" opacity="0.34" />
        <Path d="M234 225C274 219 308 218 352 207" stroke="#775CFF" strokeWidth="6" strokeLinecap="round" opacity="0.28" />
      </Svg>
    </View>
  );
}
