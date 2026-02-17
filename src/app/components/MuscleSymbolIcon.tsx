import React from 'react';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';

export type MuscleSymbolName =
  | 'fitness_center'
  | 'accessibility_new'
  | 'directions_run'
  | 'sports_gymnastics'
  | 'do_not_step'
  | 'self_improvement';

interface MuscleSymbolIconProps {
  symbol: MuscleSymbolName;
  color: string;
  size?: number;
}

const ChestIcon = ({color}: {color: string}) => (
  <>
    <Rect x="2.5" y="4.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Rect x="17.5" y="15.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Rect x="16.5" y="4.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Rect x="3.5" y="15.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="16" x2="16" y2="8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </>
);

const BackIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.5" r="2.2" fill={color} />
    <Line x1="12" y1="7.8" x2="12" y2="18.8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <Line x1="5.5" y1="9.8" x2="18.5" y2="9.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Line x1="8.5" y1="14.5" x2="8.5" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Line x1="15.5" y1="14.5" x2="15.5" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </>
);

const LegsIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="14.5" cy="4.5" r="2.2" fill={color} />
    <Path
      d="M8.5 10.5L13 8.5L16.5 11.5L19.5 11.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.5 10L10.5 15.5L7 15.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.2 11.7L16 18.8"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.2 15.2L11 19.2"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

const ShouldersIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="5" r="2.1" fill={color} />
    <Path
      d="M3.5 11.5L9 10.8L12 8.8L15 10.8L20.5 11.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9.5L12 20"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 13L7 16.2"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 13L17 16.2"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

const ArmsIcon = ({color}: {color: string}) => (
  <>
    <Rect x="2.5" y="3.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Rect x="17.5" y="16.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Line x1="7.5" y1="7.5" x2="16.5" y2="16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Rect x="17.5" y="3.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Rect x="2.5" y="16.5" width="4" height="4" rx="1" fill="none" stroke={color} strokeWidth="2" />
    <Line x1="16.5" y1="7.5" x2="7.5" y2="16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </>
);

const CoreIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.6" r="2.1" fill={color} />
    <Path
      d="M8.5 11.2C10.8 10.1 13.2 10.1 15.5 11.2"
      stroke={color}
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <Path d="M12 7.8L12 13.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M6 18.8C8 16.6 10 15.8 12 15.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M18 18.8C16 16.6 14 15.8 12 15.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M8.8 19H15.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </>
);

const iconBySymbol: Record<MuscleSymbolName, React.ComponentType<{color: string}>> = {
  fitness_center: ChestIcon,
  accessibility_new: BackIcon,
  directions_run: LegsIcon,
  sports_gymnastics: ShouldersIcon,
  do_not_step: ArmsIcon,
  self_improvement: CoreIcon,
};

export const MuscleSymbolIcon = ({
  symbol,
  color,
  size = 26,
}: MuscleSymbolIconProps): React.JSX.Element => {
  const IconComponent = iconBySymbol[symbol];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <IconComponent color={color} />
    </Svg>
  );
};
