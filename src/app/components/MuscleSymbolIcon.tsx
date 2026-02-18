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

const STROKE_WIDTH = 2;

const ChestIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.8" r="2" fill={color} />
    <Path
      d="M7 9.2C8.6 7.5 10.2 6.8 12 6.8C13.8 6.8 15.4 7.5 17 9.2"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M7.6 9.4V14.1C7.6 16.7 9.6 18.7 12 18.7C14.4 18.7 16.4 16.7 16.4 14.1V9.4"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      fill="none"
    />
    <Line x1="12" y1="9.4" x2="12" y2="18.6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M8.7 12.2C9.5 12.9 10.7 13.2 12 13.2" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none" />
    <Path d="M15.3 12.2C14.5 12.9 13.3 13.2 12 13.2" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none" />
  </>
);

const BackIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.8" r="2" fill={color} />
    <Path
      d="M6.8 9.1C8.3 7.5 10.1 6.7 12 6.7C13.9 6.7 15.7 7.5 17.2 9.1"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M8.2 9.8V14.3C8.2 16.8 9.9 18.5 12 18.5C14.1 18.5 15.8 16.8 15.8 14.3V9.8"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      fill="none"
    />
    <Line x1="12" y1="9.8" x2="12" y2="18.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M9.2 11.2L10.6 12.3L9.4 13.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M14.8 11.2L13.4 12.3L14.6 13.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>
);

const LegsIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.6" r="2" fill={color} />
    <Line x1="12" y1="6.8" x2="12" y2="9" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="15" y2="9" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M10.2 9.2L9 13.8L7.5 18" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M13.8 9.2L15 13.8L16.5 18" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M9 13.8L6.8 15.2" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M15 13.8L17.2 15.2" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
  </>
);

const ShouldersIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.8" r="2" fill={color} />
    <Path d="M6 9.3H18" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M12 7V18.8" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M6 9.3L8.8 13.7" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M18 9.3L15.2 13.7" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M10.2 12.3L7.2 15.8" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Path d="M13.8 12.3L16.8 15.8" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
  </>
);

const ArmsIcon = ({color}: {color: string}) => (
  <>
    <Path
      d="M10.8 11L9.6 9.8C8.4 8.6 6.5 8.6 5.3 9.8C4.1 11 4.1 12.9 5.3 14.1L7.2 16"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M13.2 11L14.4 9.8C15.6 8.6 17.5 8.6 18.7 9.8C19.9 11 19.9 12.9 18.7 14.1L16.8 16"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Line x1="7.2" y1="16" x2="16.8" y2="16" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Line x1="12" y1="10.4" x2="12" y2="16" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Circle cx="12" cy="7.2" r="1.7" fill={color} />
  </>
);

const CoreIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="4.6" r="1.9" fill={color} />
    <Rect x="8.1" y="7.2" width="7.8" height="11.2" rx="3" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
    <Line x1="12" y1="7.7" x2="12" y2="18.1" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Line x1="8.7" y1="11.1" x2="15.3" y2="11.1" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    <Line x1="8.7" y1="14.3" x2="15.3" y2="14.3" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
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
