import Svg, { Path } from 'react-native-svg';

const GreaterThanIcon = () => {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M9 6L15 12L9 18"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default GreaterThanIcon;