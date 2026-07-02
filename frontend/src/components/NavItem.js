import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { NavLink as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Collapse,
  Grid,
  IconButton,
  ListItem,
  Tooltip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import PulsingBadge from 'src/icons/PulsingBadge';
import useStackRef from 'src/hooks/useStackRef';
import { grey, lightBlue, yellow, green } from '@mui/material/colors';
import { Badge, badgeClasses } from '@mui/base/Badge';

const NavItem = (props) => {
  const {
    active,
    children,
    depth,
    icon,
    info,
    keyProp,
    open: openProp,
    path,
    statusIndicator,
    title,
    minimized,
    ...other
  } = props;
  const [open, setOpen] = useState(openProp);
  const theme = useTheme();
  const { activeOrgEvent } = useStackRef();

  const StyledBadge = styled(Badge)(
    ({ theme }) => `
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    list-style: none;
    position: relative;
    display: inline-block;
    line-height: 1;
  
    & .${badgeClasses.badge} {
      z-index: auto;
      position: absolute;
      top: 0;
      right: 0;
      min-width: 8px;
      height: 8px;
      white-space: nowrap;
      border-radius: 12px;
      background: ${lightBlue[500]};
      box-shadow: 0px 4px 8px ${
        theme.palette.mode === 'dark' ? grey[900] : grey[300]
      };
      transform: translate(50%, -50%);
      transform-origin: 100% 0;
    }

    & .${badgeClasses.invisible} {
      opacity: 0;
      pointer-events: none;
    }
    `,
  );

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  let paddingLeft = 16;

  if (depth > 0) {
    paddingLeft = 32 + 8 * depth;
  }

  // Branch
  if (children) {
    return (
      <ListItem
        key={keyProp + '_branch'}
        disableGutters
        sx={{
          backgroundColor: open ? theme.palette.background.default : 'inherit',
          borderRadius: 1,
          my: 1,
          display: 'block',
          py: 0,
        }}
        {...other}
      >
        {!minimized ? (
          <Button
            key={keyProp + '_branch_btn'}
            endIcon={
              !open ? (
                <ChevronRightIcon
                  key={keyProp + '_branch_chev'}
                  fontSize='small'
                />
              ) : (
                <ExpandMoreIcon
                  key={keyProp + '_branch_chev'}
                  fontSize='small'
                />
              )
            }
            onClick={handleToggle}
            startIcon={icon}
            sx={{
              color: 'text.secondary',
              fontWeight: 'fontWeightMedium',
              justifyContent: 'flex-start',
              pl: `${paddingLeft}px`,
              pr: '8px',
              py: '12px',
              textAlign: 'left',
              textTransform: 'none',
              width: '100%',
            }}
            variant='text'
          >
            <Box key={keyProp + '_branch_bx'} sx={{ flexGrow: 1 }}>
              {title}
              {statusIndicator && activeOrgEvent ? (
                <Box sx={{ display: 'inline', ml: 1 }}>
                  <PulsingBadge
                    variant={activeOrgEvent.event_status_name}
                    withBorder
                    pulsing={
                      activeOrgEvent.event_status_name === 'Running' ||
                      activeOrgEvent.event_status_name === 'Judging'
                        ? true
                        : false
                    }
                    badgeLabel={activeOrgEvent.event_status_name}
                    sx={{
                      ml: 4,
                    }}
                  />
                </Box>
              ) : null}
            </Box>
            {info}
          </Button>
        ) : (
          <Grid container>
            <Grid item>
              <StyledBadge
                invisible={
                  !statusIndicator ||
                  (activeOrgEvent?.event_status_name !== 'Running' &&
                    activeOrgEvent?.event_status_name !== 'Judging')
                }
                sx={{
                  '.MuiBadge-badge': {
                    background:
                      activeOrgEvent?.event_status_name === 'Running'
                        ? green[500]
                        : activeOrgEvent?.event_status_name === 'Judging'
                          ? yellow[500]
                          : 'none',
                  },
                }}
              >
                <Tooltip title={title || info} placement='right'>
                  <IconButton onClick={handleToggle}>{icon}</IconButton>
                </Tooltip>
              </StyledBadge>
            </Grid>
            <Grid>
              {!open ? (
                <ChevronRightIcon
                  key={keyProp + '_branch_chev'}
                  fontSize='small'
                  sx={{
                    mt: '8px',
                    mx: '-10px',
                  }}
                />
              ) : (
                <ExpandMoreIcon
                  key={keyProp + '_branch_chev'}
                  fontSize='small'
                  sx={{
                    ml: '8px',
                  }}
                />
              )}
            </Grid>
          </Grid>
        )}
        <Collapse key={keyProp + '_branch_col'} in={open}>
          {children}
        </Collapse>
      </ListItem>
    );
  }

  // Leaf
  return (
    <ListItem
      key={keyProp + '_leaf'}
      disableGutters
      sx={{
        display: 'flex',
        py: 0,
      }}
    >
      {!minimized ? (
        <Button
          key={keyProp + '_leaf_btn'}
          component={path && RouterLink}
          startIcon={icon}
          sx={{
            color: 'text.secondary',
            fontWeight: 'fontWeightMedium',
            justifyContent: 'flex-start',
            textAlign: 'left',
            pl: `${paddingLeft}px`,
            pr: '8px',
            py: '12px',
            textTransform: 'none',
            width: '100%',
            ...(active && {
              color: 'primary.main',
              fontWeight: 'fontWeightBold',
              '& svg': {
                color: 'primary.main',
              },
            }),
          }}
          variant='text'
          to={path}
        >
          <Box key={keyProp + '_leaf_bx'} sx={{ flexGrow: 1 }}>
            {title}
          </Box>
          {info}
        </Button>
      ) : (
        <Tooltip title={title || info} placement='right'>
          <IconButton
            key={keyProp + '_leaf_btn'}
            component={path && RouterLink}
            to={path}
            sx={{
              color: 'text.secondary',
              fontWeight: 'fontWeightMedium',
              ...(active && {
                color: 'primary.main',
                fontWeight: 'fontWeightBold',
                '& svg': {
                  color: 'primary.main',
                },
              }),
            }}
          >
            {icon}
          </IconButton>
        </Tooltip>
      )}
    </ListItem>
  );
};

NavItem.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  depth: PropTypes.number.isRequired,
  icon: PropTypes.node,
  info: PropTypes.node,
  open: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};

NavItem.defaultProps = {
  active: false,
  open: false,
};

export default NavItem;
