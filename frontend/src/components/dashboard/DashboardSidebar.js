import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import useAuth from 'src/hooks/useAuth';
import useSettings from 'src/hooks/useSettings';
import { stackrefConfig } from 'src/config';
// Icons
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import GestureRoundedIcon from '@mui/icons-material/GestureRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import GitHubRoundedIcon from '@mui/icons-material/GitHub';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWork';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SecurityRoundedIcon from '@mui/icons-material/Security';
import StorageRoundedIcon from '@mui/icons-material/Storage';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import CloudRoundedIcon from '@mui/icons-material/Cloud';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';

import NavSection from 'src/components/NavSection';
import Scrollbar from 'src/components/Scrollbar';

const sections = (props) => [
  {
    items: [
      {
        title: 'Overview',
        keyProp: 'dashboard_overview',
        path: '/dashboard',
        user_role_grant: 'ui',
        icon: <DashboardRoundedIcon fontSize='small' />,
      },
      {
        title: 'Account',
        keyProp: 'dashboard_account',
        path: '/dashboard/account',
        user_role_grant: 'ui',
        icon: <PersonRoundedIcon fontSize='small' />,
      },
      {
        title: 'Marketplace',
        keyProp: 'dashboard_marketplace',
        path: '/dashboard/marketplace',
        user_role_grant: 'organization_write',
        icon: <StorefrontRoundedIcon fontSize='small' />,
      },
      {
        title: 'Organization',
        path: '/dashboard/organization',
        keyProp: 'dashboard_organization',
        user_role_grant: 'organization_read',
        icon: <BusinessRoundedIcon fontSize='small' />,
        children: [
          {
            title: 'Events',
            keyProp: 'dashboard_organization_events',
            path: '/dashboard/organization/events',
            user_role_grant: 'organization_read',
            icon: <EventNoteRoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Event',
        keyProp: 'dashboard_event',
        icon: <EventNoteRoundedIcon fontSize='small' />,
        user_role_grant: 'ui',
        requires_active_event: true,
        path: '/dashboard/event',
        statusIndicator: 'activeOrgEvent',
        children: [
          {
            title: 'Overview',
            keyProp: 'dashboard_event_overview',
            path: '/dashboard/event',
            requires_active_event: true,
            user_role_grant: 'ui',
            icon: <InfoRoundedIcon fontSize='small' />,
          },
          {
            title: 'Teams',
            keyProp: 'dashboard_event_teams',
            path: '/dashboard/event/teams',
            requires_active_event: true,
            user_role_grant: 'ui',
            icon: <Groups2RoundedIcon fontSize='small' />,
          },
          {
            title: 'Leaderboard',
            keyProp: 'dashboard_event_leaderboard',
            path: '/dashboard/event/leaderboard',
            requires_active_event: true,
            user_role_grant: 'ui',
            icon: <LeaderboardRoundedIcon fontSize='small' />,
          },
          {
            title: 'Manage',
            keyProp: 'dashboard_event_manage',
            path: '/dashboard/event/manage',
            requires_active_event: true,
            user_role_grant: 'ui',
            participant_role_grant: 'Manager',
            icon: <SettingsRoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Judging',
        keyProp: 'dashboard_judging',
        icon: <GavelRoundedIcon fontSize='small' />,
        user_role_grant: 'ui',
        participant_role_grant: 'Judge',
        requires_active_event: true,
        path: '/dashboard/judging',
      },
      {
        title: 'Resources',
        path: '/dashboard/resources',
        keyProp: 'dashboard_resources',
        //user_role_grant: 'ui',
        requires_cloud_accounts_enabled: true,
        requires_active_event: true,
        icon: <StorageRoundedIcon fontSize='small' />,
        children: [
          {
            title: 'AWS Account',
            keyProp: 'dashboard_resources_aws_account',
            path: '/dashboard/resources/account/aws',
            requires_active_event: true,
            requires_cloud_accounts_enabled: true,
            //user_role_grant: 'resources_read',
            //user_role_grant: 'ui',
            icon: <CloudRoundedIcon fontSize='small' />,
          },
          {
            title: 'Status',
            keyProp: 'dashboard_resources_status',
            path: '/dashboard/resources',
            //user_role_grant: 'DISABLED',
            icon: <InfoRoundedIcon fontSize='small' />,
          },
          {
            title: 'Manage',
            keyProp: 'dashboard_resources_manage',
            path: '/dashboard/resources',
            //user_role_grant: 'DISABLED',
            icon: <SettingsRoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Team',
        keyProp: 'dashboard_team',
        path: '/dashboard/team',
        user_role_grant: 'ui',
        requires_active_event: true,
        requires_active_team: true,
        icon: <GroupRoundedIcon fontSize='small' />,
        children: [
          {
            title: 'Status',
            keyProp: 'dashboard_team_status',
            path: '/dashboard/team/status',
            requires_active_event: true,
            requires_active_team: true,
            user_role_grant: 'ui',
            icon: <InfoRoundedIcon fontSize='small' />,
          },
          {
            title: 'Kanban',
            keyProp: 'dashboard_team_kanban',
            path: '/dashboard/team/kanban',
            requires_active_event: true,
            requires_active_team: true,
            user_role_grant: 'ui',
            icon: <ViewKanbanRoundedIcon fontSize='small' />,
          },
          {
            title: 'AWS Account',
            keyProp: 'dashboard_team_aws_account',
            path: '/dashboard/team/resources/account/aws',
            requires_active_event: true,
            requires_active_team: true,
            requires_cloud_accounts_enabled: true,
            //user_role_grant: 'resources_read',
            user_role_grant: 'ui',
            icon: <CloudRoundedIcon fontSize='small' />,
          },
          {
            title: 'Manage',
            keyProp: 'dashboard_team_manage',
            path: '/dashboard/team/manage',
            user_role_grant: 'team_write',
            team_member_role_grant: 'Captain',
            icon: <SettingsRoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Performance',
        keyProp: 'dashboard_performance',
        icon: <AssessmentRoundedIcon fontSize='small' />,
        //user_role_grant: 'ui',
        children: [
          {
            title: 'Resources',
            keyProp: 'dashboard_performance_resources',
            path: '/dashboard/performance',
            //user_role_grant: 'ui',
            icon: <StorageRoundedIcon fontSize='small' />,
          },
          {
            title: 'Costs',
            keyProp: 'dashboard_performance_costs',
            path: '/dashboard/costs',
            //user_role_grant: 'ui',
            icon: <AttachMoneyRoundedIcon fontSize='small' />,
          },
          {
            title: 'Security',
            keyProp: 'dashboard_performance_security',
            path: '/dashboard/security',
            //user_role_grant: 'ui',
            icon: <SecurityRoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Collaboration',
        keyProp: 'dashboard_collaboration',
        path: '/dashboard/chat',
        //user_role_grant: 'ui',
        icon: <GroupWorkRoundedIcon fontSize='small' />,
        children: [
          {
            title: 'Code Collaboration',
            keyProp: 'dashboard_collaboration_code',
            path: '/dashboard/code_collab',
            //user_role_grant: 'ui',
            icon: <CodeRoundedIcon fontSize='small' />,
          },
          {
            title: 'Source Code Management',
            keyProp: 'dashboard_collaboration_scm',
            path: '/dashboard/scm',
            //user_role_grant: 'ui',
            icon: <GitHubRoundedIcon fontSize='small' />,
          },
          {
            title: 'Whiteboard',
            keyProp: 'dashboard_collaboration_whiteboard',
            path: '/dashboard/whiteboard',
            //user_role_grant: 'ui',
            icon: <GestureRoundedIcon fontSize='small' />,
          },
          {
            title: 'Artifacts',
            keyProp: 'dashboard_collaboration_artifacts',
            path: '/dashboard/artifacts',
            //user_role_grant: 'ui',
            icon: <WorkRoundedIcon fontSize='small' />,
          },
          {
            title: 'Message History',
            keyProp: 'dashboard_collaboration_message_history',
            path: '/dashboard/message_history',
            //user_role_grant: 'ui',
            icon: <Inventory2RoundedIcon fontSize='small' />,
          },
        ],
      },
      {
        title: 'Admin',
        path: '/dashboard/admin',
        keyProp: 'dashboard_admin',
        icon: <LockRoundedIcon fontSize='small' />,
        user_role_grant: 'organization_write',
        children: [
          {
            title: 'Organization',
            keyProp: 'dashboard_admin_organization',
            path: '/dashboard/admin/organization',
            user_role_grant: 'organization_write',
            icon: <BusinessRoundedIcon fontSize='small' />,
          },
          {
            title: 'Users',
            keyProp: 'dashboard_admin_users',
            path: '/dashboard/admin/users',
            user_role_grant: 'organization_write',
            icon: <GroupRoundedIcon fontSize='small' />,
          },
          {
            title: 'Events',
            keyProp: 'dashboard_admin_events',
            path: '/dashboard/admin/events',
            user_role_grant: 'organization_write',
            icon: <EventNoteRoundedIcon fontSize='small' />,
          },
        ],
      },
    ],
  },
];

const DashboardSidebar = (props) => {
  const { onMobileClose, openMobile } = props;
  const { settings, saveSettings } = useSettings();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const [showMinimizeTooltip, setShowMinimizeTooltip] = useState(false);

  const hiddenLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const hiddenLgDown = useMediaQuery(theme.breakpoints.down('lg'));

  const handleSettingsChange = (field, value) => {
    saveSettings({
      ...settings,
      [field]: value,
    });
  };

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- KM: If we put all deps it will always trigger (TODO: fix)
  }, [location.pathname]);

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'right',
          pt: 2,
          px: 2,
        }}
      >
        {hiddenLgDown ? null : (
          <Tooltip
            title={
              settings.minimizedSidebar ? 'Maximize menu' : 'Minimize menu'
            }
            open={showMinimizeTooltip}
            position='right'
            onMouseEnter={() => setShowMinimizeTooltip(true)}
            onMouseLeave={() => setShowMinimizeTooltip(false)}
          >
            <IconButton
              color='inherit'
              onClick={() => {
                setShowMinimizeTooltip(false);
                handleSettingsChange(
                  'minimizedSidebar',
                  !settings.minimizedSidebar,
                );
              }}
            >
              {settings.minimizedSidebar ? (
                <KeyboardDoubleArrowRightIcon />
              ) : (
                <KeyboardDoubleArrowLeftIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Scrollbar options={{ suppressScrollX: true }}>
        {!hiddenLgDown && settings.minimizedSidebar ? (
          <Tooltip title='Account' position='right'>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              sx={{
                p: 2,
              }}
            >
              <RouterLink to='/dashboard/account'>
                <Avatar
                  src={user.avatar}
                  sx={{
                    cursor: 'pointer',
                    height: 28,
                    width: 28,
                  }}
                />
              </RouterLink>
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ pb: 2, px: 2 }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
                display: 'flex',
                overflow: 'hidden',
                p: 2,
              }}
            >
              <RouterLink to='/dashboard/account'>
                <Avatar
                  src={user.avatar}
                  sx={{
                    cursor: 'pointer',
                    height: 48,
                    width: 48,
                  }}
                />
              </RouterLink>
              <Box sx={{ ml: 2 }}>
                <Typography color='textPrimary' variant='subtitle2'>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography color='textSecondary' variant='body2'>
                  {user.organization_name}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        <Divider />
        <Box sx={{ p: 2 }}>
          {sections().map((section) => (
            <NavSection
              key='nav_section'
              pathname={location.pathname}
              minimized={!hiddenLgDown && settings.minimizedSidebar}
              sx={{
                '& + &': {
                  mt: 3,
                },
              }}
              {...section}
            />
          ))}
        </Box>
        <Divider />
        {!hiddenLgDown && !settings.minimizedSidebar && (
          <Box sx={{ p: 2 }}>
            <Typography color='textPrimary' variant='subtitle2'>
              Need Help?
            </Typography>
            <Typography color='textSecondary' variant='body2'></Typography>
            <Button
              color='primary'
              fullWidth
              onClick={() =>
                window.open(
                  'https://docs.example.com',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              sx={{ mt: 2 }}
              variant='contained'
            >
              Time Out!
            </Button>
          </Box>
        )}
        <Box>
          <Typography
            variant='caption'
            display='block'
            sx={{
              textAlign: 'center',
              fontWeight: 'light',
            }}
          >
            Version {stackrefConfig.uiVersion}
          </Typography>
        </Box>
      </Scrollbar>
    </Box>
  );

  return (
    <>
      {hiddenLgDown ? (
        <Drawer
          anchor='left'
          onClose={onMobileClose}
          open={openMobile}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              mt: 8,
              width: !hiddenLgDown && settings.minimizedSidebar ? 70 : 280,
            },
          }}
          variant='temporary'
        >
          {content}
        </Drawer>
      ) : (
        <Drawer
          anchor='left'
          open
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              height: 'calc(100% - 64px) !important',
              top: '64px !Important',
              width: !hiddenLgDown && settings.minimizedSidebar ? 70 : 280,
            },
          }}
          variant='persistent'
        >
          {content}
        </Drawer>
      )}
    </>
  );
};

DashboardSidebar.propTypes = {
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool,
};

export default DashboardSidebar;
