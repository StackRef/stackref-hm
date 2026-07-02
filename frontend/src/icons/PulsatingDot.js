import { styled, keyframes } from '@mui/material/styles';

const pulseRing = keyframes`
  0% {
    transform: scale(.5);
  }
  80%, 100% {
    opacity: 0;
  }
`;

const pulseDot = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

const StyledDiv = styled('div', {
  shouldForwardProp: (prop) => prop !== 'size' && prop !== 'color',
})(({ theme, size = '10px', color }) => ({
  animation: `${pulseDot} 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) -.4s infinite`,
  backgroundColor: `var(--pulsating-dot, ${color})`,
  borderRadius: '50%',
  boxSizing: 'border-box',
  height: size,
  width: size,
  '&:before': {
    animation: `${pulseRing} 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
    backgroundColor: `var(--pulsating-dot, ${color})`,
    borderRadius: `${parseInt(size, 10) * 4.5}px`,
    content: "''",
    display: 'block',
    height: '200%',
    left: '-50%',
    position: 'relative',
    top: '-50%',
    width: '200%',
  },
}));

const PulsatingDot = (props) => {
  return <StyledDiv {...props} />;
};

export default PulsatingDot;
