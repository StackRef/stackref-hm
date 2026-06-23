import { forwardRef, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grow,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useSettings from 'src/hooks/useSettings';
import useStackRef from 'src/hooks/useStackRef';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const getValues = (settings) => ({
  compact: settings.compact,
  direction: settings.direction,
  responsiveFontSizes: settings.responsiveFontSizes,
  roundedCorners: settings.roundedCorners,
  minimizedSidebar: settings.minimizedSidebar,
  showNextSteps: settings.showNextSteps,
  theme: settings.theme,
});

const OverviewNextSteps = (props) => {
  const { ...other } = props;
  const { user } = useAuth();
  const theme = useTheme();
  const { settings, saveSettings } = useSettings();
  const {
    initializeOrgEvents,
    initializeOrgUsers,
    organization,
    orgEvents,
    orgUsers,
  } = useStackRef();
  const [isLoading, setLoading] = useState(true);
  const [settingsValues, setSettingsValues] = useState(getValues(settings));

  console.log(':: OverviewNextSteps');

  const OverviewNextStepsCard = forwardRef((props, ref) => {
    return (
      <Card ref={ref} {...props}>
        <CardHeader
          title='What next?'
          subheader='Here are some next steps for getting the most out of StackRef'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            py: 1,
            '& .MuiCardHeader-subheader': {
              color: theme.palette.background.paper,
            },
          }}
        />
        <CardContent>
          <List>
            <ListItem key='inviteUsers'>
              <ListItemAvatar>
                {orgUsers?.length > 1 ? (
                  <CheckCircleOutlineIcon color='success' />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Link
                    color='textPrimary'
                    underline='none'
                    component={RouterLink}
                    to='/dashboard/admin/users'
                  >
                    Invite users to your Organization
                  </Link>
                }
              />
            </ListItem>
            <ListItem key='purchaseStackCash'>
              <ListItemAvatar>
                {organization?.bank_balance > 0 ? (
                  <CheckCircleOutlineIcon color='success' />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Link
                    color='textPrimary'
                    underline='none'
                    component={RouterLink}
                    to='/dashboard/marketplace'
                  >
                    Purchase StackCash to schedule Events (1 Event = 100
                    StackCash)
                  </Link>
                }
              />
            </ListItem>
            <ListItem key='firstEvent'>
              <ListItemAvatar>
                {orgEvents?.length > 0 ? (
                  <CheckCircleOutlineIcon color='success' />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Link
                    color='textPrimary'
                    underline='none'
                    component={RouterLink}
                    to='/dashboard/admin/events/create'
                  >
                    Schedule your first Event
                  </Link>
                }
              />
            </ListItem>
          </List>
        </CardContent>
        <CardActions>
          <Button
            onClick={() => {
              handleSettingsChange('showNextSteps', false);
            }}
          >
            Dismiss
          </Button>
        </CardActions>
      </Card>
    );
  });

  const handleSettingsChange = (field, value) => {
    saveSettings({
      ...settingsValues,
      [field]: value,
    });
  };

  useEffect(() => {
    setSettingsValues(getValues(settings));
  }, [settings]);

  useEffect(() => {
    async function initialize() {
      await initializeOrgEvents();
      await initializeOrgUsers();
      setLoading(false);
    }
    initialize();
  }, [initializeOrgEvents, initializeOrgUsers]);

  return user?.user_role_grants?.includes('organization_write') &&
    !isLoading &&
    (!orgEvents || orgEvents?.length === 0 || orgUsers?.length === 1) ? (
    <Grow in={settings?.showNextSteps} unmountOnExit>
      <OverviewNextStepsCard />
    </Grow>
  ) : null;
};

export default OverviewNextSteps;
