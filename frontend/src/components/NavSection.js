import PropTypes from 'prop-types';
import { matchPath } from 'react-router-dom';
import { List, ListSubheader } from '@mui/material';
import NavItem from './NavItem';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';

const NavSection = (props) => {
  const { items, pathname, title, minimized, ...other } = props;
  const { user } = useAuth();
  const { activeOrgEvent, activeTeam, activeTeamMember, participant } =
    useStackRef();

  const renderNavItems = ({
    depth = 0,
    items,
    pathname,
    minimized,
    activeOrgEvent,
    participant,
  }) => (
    <List key={pathname} disablePadding>
      {items.reduce(
        // eslint-disable-next-line no-use-before-define
        (acc, item) =>
          reduceChildRoutes({
            acc,
            item,
            pathname,
            depth,
            minimized,
            activeOrgEvent,
            participant,
          }),
        [],
      )}
    </List>
  );

  const reduceChildRoutes = ({ acc, pathname, item, depth, minimized }) => {
    const key = `${item.key}-${depth}`;
    const exactMatch = item.path
      ? !!matchPath(
          {
            path: item.path,
            end: true,
          },
          pathname,
        )
      : false;

    // Check the User's grants for display of menu items
    if (!user.user_role_grants?.includes(item.user_role_grant)) {
      return acc;
    }

    // If item requires a user setting that is not set, don't render
    if (
      item.required_user_setting &&
      !user.settings?.[item.required_user_setting]
    ) {
      return acc;
    }

    // Requires cloud accounts enabled
    if (
      item.requires_cloud_accounts_enabled &&
      !activeOrgEvent?.cloud_accounts_enabled
    ) {
      return acc;
    }

    // Requires a current active Event set
    if (item.requires_active_event && !activeOrgEvent?.event_uuid) {
      return acc;
    }

    // Requires a current active Team set
    if (item.requires_active_team && !activeTeam?.team_uuid) {
      return acc;
    }

    // Check User's Participant role grants for display of menu items
    const hasParticipantRole = participant?.participant_roles?.some(
      (role) => role.participant_role_name === item.participant_role_grant,
    );
    if (item.participant_role_grant && !hasParticipantRole) return acc;

    // Check User's Team Member role grants for display of menu items
    const hasTeamMemberRole = activeTeamMember?.team_member_roles?.some(
      (role) => role.team_member_role_name === item.team_member_role_grant,
    );
    if (item.team_member_role_grant && !hasTeamMemberRole) return acc;

    if (item.children) {
      const partialMatch = item.path
        ? !!matchPath(
            {
              path: item.path,
              end: false,
            },
            pathname,
          )
        : false;

      acc.push(
        <NavItem
          active={partialMatch}
          depth={depth}
          icon={item.icon}
          info={item.info}
          key={item.keyProp}
          keyProp={item.keyProp}
          open={partialMatch}
          path={item.path}
          statusIndicator={item.statusIndicator}
          title={item.title}
          minimized={minimized}
        >
          {renderNavItems({
            depth: depth + 1,
            items: item.children,
            pathname,
            minimized,
          })}
        </NavItem>,
      );
    } else {
      acc.push(
        <NavItem
          active={exactMatch}
          depth={depth}
          icon={item.icon}
          info={item.info}
          key={item.keyProp}
          keyProp={item.keyProp}
          path={item.path}
          statusIndicator={item.statusIndicator}
          title={item.title}
          minimized={minimized}
        />,
      );
    }

    return acc;
  };

  return (
    <List
      key='nav_section_lst'
      subheader={
        !minimized && (
          <ListSubheader
            key='nav_section_lstsh'
            disableGutters
            disableSticky
            sx={{
              color: 'text.primary',
              fontSize: '0.75rem',
              lineHeight: 2.5,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {!minimized && title}
          </ListSubheader>
        )
      }
      {...other}
    >
      {renderNavItems({
        items,
        pathname,
        minimized,
      })}
    </List>
  );
};

NavSection.propTypes = {
  items: PropTypes.array,
  pathname: PropTypes.string,
  title: PropTypes.string,
  keyProp: PropTypes.string,
};

export default NavSection;
