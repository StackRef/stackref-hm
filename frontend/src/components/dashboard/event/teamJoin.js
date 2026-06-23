import { toast } from 'react-toastify';
import TeamMemberCreate from './TeamMemberCreate';

export const handleRequestToJoin = async (props) => {
  const { user, participant, team } = props;

  const payload = {
    user: user,
    action: 'request_join',
    participant_uuid: participant.participant_uuid,
    team_uuid: team.team_uuid,
  };
  try {
    await TeamMemberCreate(payload, (response) => {
      if (!response || response.status_code !== 200)
        throw new Error('Request failed');
    })
      .then(async () => {
        toast.success(`Sent request to join '${team.team_details.team_name}'`, {
          containerId: 'results',
        });
      })
      .catch((error) => {
        toast.error(error.message, { containerId: 'results' });
        throw error;
      });
  } catch (error) {
    console.error(`>> handleRequestToJoin: ${error}`);
  }
};
