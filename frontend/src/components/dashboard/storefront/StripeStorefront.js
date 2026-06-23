import { Box, Skeleton } from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import { stripeConfig } from 'src/config';

const StripeStorefront = (props) => {
  const { user } = useAuth();
  const { organization } = useStackRef();

  console.log(':: StripeStorefront');

  return (
    <>
      <Box
        sx={{
          width: '100%',
        }}
      >
        {!organization?.organization_uuid || !user?.email ? (
          <Skeleton height='400px' width='100%' />
        ) : (
          <stripe-pricing-table
            pricing-table-id={stripeConfig.pricingTable}
            publishable-key={stripeConfig.publicKey}
            client-reference-id={organization.organization_uuid}
            customer-email={user.email}
          ></stripe-pricing-table>
        )}
      </Box>
    </>
  );
};

export default StripeStorefront;
