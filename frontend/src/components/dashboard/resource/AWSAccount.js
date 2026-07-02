import { useCallback, useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetCloudAccount from 'src/components/stackref/GetCloudAccount';
import CloudAccountUpdate from './CloudAccountUpdate';
import CloudAccountUserCreate from './CloudAccountUserCreate';
import LoadingScreen from 'src/components/LoadingScreen';

const AWSAccount = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [cloudAccount, setCloudAccount] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [teamMember, setTeamMember] = useState();
  const { activeTeam, participant, teamMembers } = useStackRef();

  console.log(':: AWSAccount');

  useEffect(() => {
    setTeamMember(
      teamMembers?.find(
        (teamMember) =>
          teamMember.participant_uuid === participant?.participant_uuid,
      ),
    );
  }, [teamMembers, participant]);

  const cloudAccountUserCreate = async () => {
    if (cloudAccount) {
      if (
        cloudAccount.cloud_account_users?.find(
          (cloud_account_user) =>
            user.user_uuid === cloud_account_user.user_uuid,
        )
      ) {
        console.log(':: User found attached to cloud account');
        return true;
      } else {
        try {
          setSubmitting(true);

          const payload = {};
          payload['user'] = user;
          payload['entity_uuid'] = activeTeam?.team_uuid;

          await CloudAccountUserCreate(payload, (response) => {
            console.log(response);
            //if (!response || response.status_code !== 200)
            if (!response)
              throw new Error('Cloud account user assignment failed');
          })
            .then(() => {
              setSubmitting(false);
              toast.success('Cloud account user assigned', {
                containerId: 'results',
              });
              getCloudAccount();
              return true;
            })
            .catch((err) => {
              setSubmitting(false);
              toast.error(err.message, { containerId: 'results' });
              return false;
            });
        } catch (err) {
          console.error(`>> CloudAccountUserCreate: ${err}`);
          setSubmitting(false);
          return false;
        }
      }
    }
  };

  const getCloudAccount = useCallback(async () => {
    if (activeTeam?.team_uuid) {
      try {
        await GetCloudAccount(user, activeTeam.team_uuid)
          .then(async (data) => {
            try {
              if (data) {
                setCloudAccount(data);
              } else {
                setCloudAccount(null);
              }
              setLoading(false);
            } catch (err) {
              throw new Error(err);
            }
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error(`>> getCloudAccount: ${err}`);
        setCloudAccount(null);
        setLoading(false);
      }
    }
  }, [activeTeam, user]);

  useEffect(() => {
    getCloudAccount();
  }, [getCloudAccount]);

  const handleClick = async () => {
    console.log(':: Creating Cloud Account User if it does not exist');
    setSubmitting(true);
    try {
      const cloudAccountUser = await cloudAccountUserCreate();
      if (cloudAccountUser)
        // NOTE: If user had already signed into AWS but had no account assigned yet, they would need to logout and back in again to see it
        //window.open('https://example-sso.awsapps.com/start#/signout', '_blank', 'noopener,noreferrer');
        window.open(
          'https://example-sso.awsapps.com/start',
          '_blank',
          'noopener,noreferrer',
        );
    } catch (err) {
      console.error(`>> cloudAccountUserCreate: ${err}`);
    }
    setSubmitting(false);
  };

  const handleCreateClick = async () => {
    try {
      setSubmitting(true);

      const payload = {};
      payload['user'] = user;
      payload['action'] = 'assign';
      payload['entity_uuid'] = activeTeam?.team_uuid;

      await CloudAccountUpdate(payload, (response) => {
        console.log(response);
        //if (!response || response.status_code !== 200)
        if (!response) throw new Error('Cloud account assignment failed');
      })
        .then(() => {
          setSubmitting(false);
          toast.success('Cloud account assigned', { containerId: 'results' });
          getCloudAccount();
          setSubmitting(false);
        })
        .catch((err) => {
          setSubmitting(false);
          toast.error(err.message, { containerId: 'results' });
        });
    } catch (err) {
      console.error(`>> CloudAccountUpdate: ${err}`);
      setSubmitting(false);
    }
  };

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Box
      align='center'
      alignItems='center'
      justifyContent='center'
      height='100vh'
      style={{ height: '100vh', minHeight: '100vh' }}
    >
      <Box>
        {cloudAccount && teamMember?.team_member_roles?.length > 0 ? (
          <LoadingButton
            color='primary'
            sx={{ m: 1 }}
            onClick={handleClick}
            variant='contained'
            loading={isSubmitting}
            disabled={isSubmitting || !cloudAccount?.cloud_account_name}
            loadingIndicator='Creating user'
          >
            {cloudAccount?.cloud_account_name ? (
              <>
                Access Your Account
                <br />({cloudAccount?.cloud_account_name})
              </>
            ) : (
              <>No Cloud Account Exists</>
            )}
          </LoadingButton>
        ) : (
          <Box alignItems='center'>
            <Chip
              label={
                <Typography color='textPrimary' variant='h6'>
                  NO CLOUD ACCOUNT EXISTS
                </Typography>
              }
            />
            {activeTeam &&
            teamMember?.team_member_roles?.find(
              (role) => role.team_member_role_name === 'Captain',
            ) ? (
              <>
                <br />
                <LoadingButton
                  color='primary'
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={handleCreateClick}
                  sx={{ m: 1 }}
                  variant='contained'
                >
                  Assign A Cloud Account
                </LoadingButton>
              </>
            ) : null}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AWSAccount;
