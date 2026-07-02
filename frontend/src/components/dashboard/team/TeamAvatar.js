import { useEffect, useState } from 'react';
import { stackrefConfig } from 'src/config';
import useAuth from 'src/hooks/useAuth';
import { Skeleton } from '@mui/material';
import Image from 'mui-image';
import Gravatar from 'src/icons/Gravatar';

export const TeamAvatar = (props) => {
  console.log(':: TeamAvatar');

  const { teamUuid, assetUuid, ...other } = props;
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
          `${srAPIUrl}?entity_uuid=${teamUuid}&asset_uuid=${assetUuid}`,
          requestOptions,
        );

        if (!response.ok) {
          const error = new Error(`>> TeamAvatar: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data = await response.blob();
        setImageData(data);
        setLoading(false);
      } catch (err) {
        console.error(`>> TeamAvatar: ${err}`);
        setLoading(false);
      }
    }
    if (assetUuid && teamUuid && user.token) initialize();
    return () => setImageData(null);
  }, [assetUuid, teamUuid, user.token]);

  return isLoading ? (
    <Skeleton height={40} width={40} variant='circular' {...other} />
  ) : !imageData || !URL.createObjectURL(imageData) ? (
    <Gravatar emailAddress={teamUuid} {...other} />
  ) : (
    <div style={{ marginRight: props.withBorder ? 0 : 8 }}>
      <Image
        errorIcon={null}
        height={40}
        src={
          imageData && URL.createObjectURL(imageData)
            ? URL.createObjectURL(imageData)
            : '/static/images/hackathon_group.svg'
        }
        style={{ marginRight: 0 }}
        width={40}
        wrapperStyle={{
          borderRadius: '50%',
          overflow: 'hidden',
        }}
        {...other}
      />
    </div>
  );
};

export default TeamAvatar;
