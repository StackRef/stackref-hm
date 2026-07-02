import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { forwardRef } from 'react';

const LabelRoot = styled('span')(({ theme, styleProps }) => {
  const bgcolor = theme.palette[styleProps.color].main;
  const color = theme.palette[styleProps.color].contrastText;

  return {
    alignItems: 'center',
    bgcolor,
    borderRadius: theme.shape.borderRadius,
    color,
    cursor: 'default',
    display: 'inline-flex',
    flexGrow: 0,
    flexShrink: 0,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.pxToRem(11),
    fontWeight: theme.typography.fontWeightMedium,
    justifyContent: 'center',
    letterSpacing: 0.5,
    minWidth: 20,
    pb: theme.spacing(0.5),
    pl: theme.spacing(1),
    pr: theme.spacing(1),
    pt: theme.spacing(0.5),
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
});

const Label = forwardRef(function Label(props, ref) {
  const { color = 'primary', children, ...other } = props;

  const styleProps = { color };

  return (
    <LabelRoot styleProps={styleProps} ref={ref} {...other}>
      {children}
    </LabelRoot>
  );
});

Label.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf([
    'primary',
    'secondary',
    'error',
    'warning',
    'success',
  ]),
};

export default Label;
