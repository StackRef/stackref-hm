import { useCallback, useState, useEffect } from 'react';
import numeral from 'numeral';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
//import StackCashRounded from 'src/icons/StackCashRounded';
import PurchaseStackCash from 'src/components/dashboard/storefront/PurchaseStackCash';

import GetOrgDetails from 'src/components/stackref/GetOrgDetails';
import { useTheme } from '@mui/material/styles';

const OrganizationStackCash = (props) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { organization } = useStackRef();
  const [orgDetails, setOrgDetails] = useState();

  console.log(':: OrganizationStackCash');

  const getOrgDetails = useCallback(async () => {
    console.log(':: getOrgDetails');
    try {
      await GetOrgDetails(user)
        .then((data) => {
          setOrgDetails(data);
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.error(`>> getOrgDetails: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    getOrgDetails();
  }, [getOrgDetails, organization]);

  return (
    <Card
      sx={{
        width: '300px',
      }}
    >
      <CardHeader
        title='Organization StackCash'
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          py: 1,
        }}
      />
      <CardContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {!orgDetails?.bank_balance ? (
          <Skeleton sx={{ height: 80, width: 200 }} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='h3' sx={{ textAlign: 'center' }}>
                {numeral(orgDetails.bank_balance).format('0,0.00')}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '16px',
              }}
            >
              <PurchaseStackCash sx={{ m: -1 }} />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationStackCash;
