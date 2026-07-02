import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import GetTeamAnalysis from 'src/components/stackref/GetTeamAnalysis';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<Skeleton />}>
    <Component {...props} />
  </Suspense>
);

const SccResults = Loadable(lazy(() => import('./SccResults')));
const SnykScoreChart = Loadable(lazy(() => import('./SnykScoreChart')));
const CodeClimateScoreChart = Loadable(
  lazy(() => import('./CodeClimateScoreChart')),
);
const InfracostResults = Loadable(lazy(() => import('./InfracostResults')));
const CossellResults = Loadable(lazy(() => import('./CossellResults')));

const TeamAnalysis = (props) => {
  const { team, ...other } = props;
  const isMountedRef = useIsMountedRef();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const [teamAnalysisItems, setTeamAnalysisItems] = useState([]);
  const { activeTeam } = useStackRef();

  const thisTeam = useMemo(
    () => (team ? team : activeTeam),
    [team, activeTeam],
  );

  const getTeamAnalysis = useCallback(async () => {
    console.log(':: getTeamAnalysis');
    try {
      await GetTeamAnalysis(user, thisTeam.team_uuid)
        .then((data) => {
          try {
            setTeamAnalysisItems(data);
          } catch (err) {
            setTeamAnalysisItems([]);
            throw err;
          }
          setLoading(false);
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      console.error(`>> getTeamAnalysis: ${err}`);
    }
  }, [thisTeam, user]);

  useEffect(() => {
    async function initialize() {
      if (thisTeam) await getTeamAnalysis();
    }
    initialize();
  }, [thisTeam, getTeamAnalysis]);

  const codeClimateItems = teamAnalysisItems.filter(
    (teamAnalysis) =>
      teamAnalysis.team_analysis_result_source === 'codeclimate',
  );

  const sccItems = teamAnalysisItems.filter(
    (teamAnalysis) => teamAnalysis.team_analysis_result_source === 'scc',
  );

  const snykItems = teamAnalysisItems.filter(
    (teamAnalysis) => teamAnalysis.team_analysis_result_source === 'snyk',
  );

  const infracostItems = teamAnalysisItems.filter(
    (teamAnalysis) => teamAnalysis.team_analysis_result_source === 'infracost',
  );

  const cossellItems = teamAnalysisItems.filter(
    (teamAnalysis) => teamAnalysis.team_analysis_result_source === 'cossell',
  );

  return (
    <Box {...other}>
      {isLoading ? (
        <Box
          sx={{
            p: 2,
          }}
        >
          <Skeleton height={60} />
        </Box>
      ) : !teamAnalysisItems || teamAnalysisItems.length < 1 ? (
        <Card>
          <CardContent>
            <Typography
              sx={{ color: 'text.primary', fontStyle: 'italic', mt: 1 }}
            >
              No code analysis received yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Grid
            container
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            <Grid item>
              {codeClimateItems.length ? (
                <CodeClimateScoreChart
                  results={codeClimateItems[0].team_analysis_result_json}
                  tsCreated={codeClimateItems[0].ts_created}
                  sx={{
                    width: '400px',
                  }}
                />
              ) : null}
            </Grid>
            <Grid item>
              {snykItems.length ? (
                <SnykScoreChart
                  results={snykItems[0].team_analysis_result_json}
                  tsCreated={snykItems[0].ts_created}
                  sx={{
                    width: '400px',
                  }}
                />
              ) : null}
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            {sccItems.length ? (
              <SccResults results={sccItems[0].team_analysis_result_json} />
            ) : null}
          </Box>
          <Box sx={{ mt: 2 }}>
            {infracostItems.length ? (
              <InfracostResults
                results={infracostItems[0].team_analysis_result_json}
                tsCreated={infracostItems[0].ts_created}
              />
            ) : null}
          </Box>
          <Box sx={{ mt: 2 }}>
            {cossellItems.length ? (
              <CossellResults
                results={cossellItems[0].team_analysis_result_json}
                tsCreated={cossellItems[0].ts_created}
              />
            ) : null}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TeamAnalysis;
