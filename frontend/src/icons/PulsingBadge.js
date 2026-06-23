import { Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { red, lightBlue, yellow, green } from '@mui/material/colors';

const PulsingBadge = ({
  withBorder = false,
  pulsing = true,
  badgeLabel = '',
  variant = 'ready',
  size = 10,
  textSize = 'caption',
}) => {
  const variantColors = {
    notready: red[500],
    ready: yellow[200],
    info: lightBlue[500],
    complete: lightBlue[500],
    running: green[500],
    judging: yellow[500],
  };

  const createPulseKeyframes = (color) => keyframes`
    0% { box-shadow: 0 0 0 0 ${alpha(color, 0.5)}; }
    70% { box-shadow: 0 0 0 8px ${alpha(color, 0.0)}; }
    100% { box-shadow: 0 0 0 0 ${alpha(color, 0.0)}; }
  `;

  const pulseKeyframes = {
    notready: createPulseKeyframes(variantColors.notready),
    ready: createPulseKeyframes(variantColors.ready),
    info: createPulseKeyframes(variantColors.info),
    complete: createPulseKeyframes(variantColors.complete),
    running: createPulseKeyframes(variantColors.running),
    judging: createPulseKeyframes(variantColors.judging),
  };

  const variantKey = variant.toLowerCase(); // convert variant to lowercase

  const Container = styled('span')(({ theme }) => ({
    position: 'relative',
    display: 'inline-block',
  }));

  const Badge = styled('div')(({ theme, variant, withBorder }) => ({
    backgroundColor: theme.palette.background.default,
    right: 10,
    top: 10,
    display: 'flex',
    flexBasis: '1 0 100px',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius + 15,
    borderColor: withBorder
      ? alpha(variantColors[variant], 0.5)
      : 'transparent',
    borderStyle: withBorder ? 'solid' : 'none',
    borderWidth: '1px',
  }));

  const Circle = styled('div', {
    shouldForwardProp: (prop) =>
      prop !== 'size' && prop !== 'pulsing' && prop !== 'variant',
  })(({ theme, size = 10, pulsing, variant }) => {
    const animationRule = `${pulseKeyframes[variant]} 1500ms ${theme.transitions.easing.easeOut} infinite`;
    return {
      margin: 4.4,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: variantColors[variant],
      ...(pulsing && {
        animation: animationRule,
      }),
    };
  });

  return (
    <Container>
      <Badge variant={variantKey} withBorder={withBorder}>
        <Circle size={size} pulsing={pulsing} variant={variantKey} />
        {badgeLabel?.length > 0 ? (
          <Typography variant={textSize} sx={{ marginRight: 1 }}>
            {badgeLabel}
          </Typography>
        ) : null}
      </Badge>
    </Container>
  );
};

export default PulsingBadge;
