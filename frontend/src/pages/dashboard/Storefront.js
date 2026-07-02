import { lazy, Suspense, useCallback, useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import { useTheme } from '@mui/material/styles';
import useSettings from 'src/hooks/useSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import gtm from 'src/lib/gtm';
import LoadingScreen from 'src/components/LoadingScreen';
import GetMarketplace from 'src/components/stackref/GetMarketplace';
import AmzMarketplaceDialog from 'src/components/dashboard/storefront/AmzMarketplaceDialog';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const StripeStorefront = Loadable(
  lazy(() => import('src/components/dashboard/storefront/StripeStorefront')),
);

const Storefront = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { organization } = useStackRef();
  const [marketplace, setMarketplace] = useState();
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  console.log(':: Storefront');

  const handlePurchaseOpen = () => {
    setPurchaseOpen(true);
  };

  const handlePurchaseClose = () => {
    setPurchaseOpen(false);
  };

  const getMarketplace = useCallback(async () => {
    console.log(':: getMarketplace');
    try {
      await GetMarketplace(user)
        .then((data) => {
          setMarketplace(data);
        })
        .catch((error) => {
          console.error('>> GetMarketplace: ', error);
          throw new Error(error);
        });
    } catch (error) {
      console.log(`>> getMarketplace: ${error}`);
    }
  }, [user]);

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    getMarketplace();
  }, [getMarketplace]);

  return (
    <>
      <Helmet>
        <title>Marketplace | Dashboard | StackRef</title>
        <script async src='https://js.stripe.com/v3/pricing-table.js'></script>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          minHeight: '100%',
          py: 8,
        }}
      >
        <Container maxWidth={settings.compact ? 'xl' : false}>
          <Grid container justifyContent='space-between' spacing={3}>
            <Grid item>
              <Typography color='textPrimary' variant='h5'>
                Marketplace
              </Typography>
              <Breadcrumbs
                aria-label='breadcrumb'
                separator={<ChevronRightIcon fontSize='small' />}
                sx={{ mt: 1 }}
              >
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard'
                  variant='subtitle2'
                >
                  Dashboard
                </Link>
                <Typography color='textSecondary' variant='subtitle2'>
                  Marketplace
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          <Divider />
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: 'flex',
                mb: 1,
              }}
            >
              <Typography color='textPrimary' gutterBottom variant='body1'>
                Think of <b>"StackCash"</b> (SC) as a virtual credit system
                within StackRef.
                <br />
                <br />
                Organizations must have StackCash allocated to their accounts to
                schedule Events. When an Event is scheduled, StackCash is
                reallocated from the Organization to the Event. Event managers
                can then choose to assign StackCash to Teams, to then be used
                for deploying and utilizing cloud resources and <b>
                  "Edges"
                </b>{' '}
                <i>(coming soon)</i>.
              </Typography>
            </Box>
            {marketplace ? (
              <Card sx={{ my: 2 }}>
                <CardHeader
                  title='Event Marketplace'
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.background.paper,
                    py: 1,
                  }}
                />
                <CardContent>
                  <List dense>
                    {marketplace.map((marketplace_item) => {
                      return (
                        <ListItem
                          key={'mpi_' + marketplace_item.marketplace_item_id}
                        >
                          <Typography variant='subtitle2'>
                            {marketplace_item.marketplace_item_description}:{' '}
                            {marketplace_item.stackcash_cost} SC
                          </Typography>
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            ) : null}
            {user.user_role_grants?.includes('organization_write') &&
            organization?.amazon_marketplace_entitlements ? (
              <Typography
                color='textPrimary'
                sx={{ my: 2, fontWeight: 'bold' }}
              >
                Add more StackCash to your Amazon Marketplace Entitlement via
                the
                <Link
                  onClick={handlePurchaseOpen}
                  sx={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  {' Amazon Marketplace '}
                </Link>
                or select an option below.
                <AmzMarketplaceDialog
                  open={purchaseOpen}
                  onClose={handlePurchaseClose}
                />
              </Typography>
            ) : (
              <Typography
                color='textPrimary'
                sx={{ my: 2, fontWeight: 'bold' }}
              >
                You can purchase StackCash via{' '}
                <Link
                  href='https://aws.amazon.com/marketplace/pp/prodview-eaoyh5cthzovo'
                  target='_blank'
                  rel='noopener'
                  sx={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  our Amazon Marketplace listing
                </Link>
                , or select an option below.
                <AmzMarketplaceDialog
                  open={purchaseOpen}
                  onClose={handlePurchaseClose}
                />
              </Typography>
            )}
            <StripeStorefront />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Storefront;
