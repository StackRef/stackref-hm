import { toast } from 'react-toastify';
import TeamMemberEdit from 'src/components/team/TeamMemberEdit';

export const handleRequestToLeave = async (props) => {
  const { user, team, teamMember } = props;

  console.log(':: handleRequestToLeave');

  const payload = {
    user: user,
    action: 'delete',
    team_uuid: teamMember?.team_uuid,
    team_member_uuid: teamMember?.team_member_uuid,
  };

  try {
    await TeamMemberEdit(payload, (response) => {
      if (!response || response.status_code !== 200)
        throw new Error('Request failed');
    })
      .then(async () => {
        toast.success(
          `Sent request to leave '${team?.team_details?.team_name}'`,
          { containerId: 'results' },
        );
      })
      .catch((error) => {
        toast.error(error.message, { containerId: 'results' });
        throw error;
      });
  } catch (error) {
    console.error(`>> handleRequestToLeave: ${error}`);
  }
};
