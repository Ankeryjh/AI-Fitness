import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

export type AppTabIconName = 'training' | 'profile';

interface AppTabIconProps {
  name: AppTabIconName;
  color: string;
  size?: number;
}

const TrainingIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="12" r="6.2" stroke={color} strokeWidth="1.9" fill="none" />
    <Circle cx="12" cy="12" r="2.3" stroke={color} strokeWidth="1.9" fill="none" />
    <Path d="M12 2.9V5.1M12 18.9V21.1M2.9 12H5.1M18.9 12H21.1" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
  </>
);

const ProfileIcon = ({color}: {color: string}) => (
  <>
    <Circle cx="12" cy="8.1" r="3.2" stroke={color} strokeWidth="1.9" fill="none" />
    <Path
      d="M5.7 18.6C6.9 15.6 9.1 14.1 12 14.1C14.9 14.1 17.1 15.6 18.3 18.6"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      fill="none"
    />
  </>
);

const iconMap: Record<AppTabIconName, React.ComponentType<{color: string}>> = {
  training: TrainingIcon,
  profile: ProfileIcon,
};

export const AppTabIcon = ({name, color, size = 22}: AppTabIconProps): React.JSX.Element => {
  const Icon = iconMap[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Icon color={color} />
    </Svg>
  );
};
