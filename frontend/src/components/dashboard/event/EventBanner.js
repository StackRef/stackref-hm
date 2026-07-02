import { useEffect, useState } from 'react';
import { stackrefConfig } from 'src/config';
import useAuth from 'src/hooks/useAuth';
import { Box, Skeleton } from '@mui/material';
import Image from 'mui-image';

export const EventBanner = (props) => {
  console.log(':: EventBanner');

  const { eventUuid, assetUuid, ...other } = props;
  const { user } = useAuth();
  const [imageData, setImageData] = useState(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      const srAPIUrl = `${stackrefConfig.apiUrl}/assetRead`;

      const requestOptions = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
        },
        mode: 'cors',
      };

      try {
        const response = await fetch(
          `${srAPIUrl}?entity_uuid=${eventUuid}&asset_uuid=${assetUuid}`,
          requestOptions,
        );

        if (!response.ok) {
          const error = new Error(`>> EventBanner: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data = await response.blob();
        setImageData(data);
        setLoading(false);
      } catch (err) {
        console.error(`>> EventBanner: ${err}`);
        setLoading(false);
      }
    }
    if (assetUuid && eventUuid && user.token) initialize();
  }, [assetUuid, eventUuid, user.token]);

  return isLoading ? (
    <Box
      alignItems='center'
      display='flex'
      height={300}
      justifyContent='center'
      maxWidth='100%'
      mx='auto'
    >
      <Skeleton height='100%' width='100%' sx={{ maxWidth: '100%' }} />
    </Box>
  ) : (
    <Image
      errorIcon={null}
      height={300}
      src={
        imageData && URL.createObjectURL(imageData)
          ? URL.createObjectURL(imageData)
          : '/static/images/hackathon_group.svg'
      }
      width={600}
      wrapperStyle={{
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      {...other}
    />
  );
};

export default EventBanner;
