import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router';
import AuthGuard from './components/AuthGuard';
import GuestGuard from './components/GuestGuard';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/MainLayout';

console.log(':: routes');

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// Dashboard pages

const Account = Loadable(lazy(() => import('./pages/dashboard/Account')));
const Overview = Loadable(lazy(() => import('./pages/dashboard/Overview')));
const CloudAccount = Loadable(
  lazy(() => import('./pages/dashboard/CloudAccount')),
);
const Events = Loadable(lazy(() => import('./pages/dashboard/Events')));
const EventManage = Loadable(
  lazy(() => import('./pages/dashboard/event/EventManage')),
);
const LeaderBoard = Loadable(
  lazy(() => import('./pages/dashboard/event/LeaderBoard')),
);
const EventTeams = Loadable(
  lazy(() => import('./pages/dashboard/event/EventTeams')),
);
const ActiveEventOverview = Loadable(
  lazy(() => import('./pages/dashboard/event/ActiveEventOverview')),
);
const InactiveEventOverview = Loadable(
  lazy(() => import('./pages/dashboard/event/InactiveEventOverview')),
);
const ActiveTeamOverview = Loadable(
  lazy(() => import('./pages/dashboard/team/ActiveTeamOverview')),
);
const EventJudging = Loadable(
  lazy(() => import('./pages/dashboard/EventJudging')),
);
const Kanban = Loadable(lazy(() => import('./pages/dashboard/team/Kanban')));
const TeamManage = Loadable(
  lazy(() => import('./pages/dashboard/team/TeamManage')),
);

// Dashboard Admin pages

const EventCreate = Loadable(
  lazy(() => import('./pages/dashboard/admin/EventCreate')),
);
const EventsManage = Loadable(
  lazy(() => import('./pages/dashboard/admin/EventsManage')),
);
const EventEdit = Loadable(
  lazy(() => import('./pages/dashboard/admin/EventEdit')),
);
const Organization = Loadable(
  lazy(() => import('./pages/dashboard/admin/Organization')),
);
const Teams = Loadable(lazy(() => import('./pages/NotFound'))); // TODO
const Users = Loadable(lazy(() => import('./pages/dashboard/admin/Users')));
const JudgingCriterionCreate = Loadable(
  lazy(() => import('./pages/dashboard/admin/JudgingCriterionCreate')),
);
const JudgingCriterionEdit = Loadable(
  lazy(() => import('./pages/dashboard/admin/JudgingCriterionEdit')),
);
const EventTeamEdit = Loadable(
  lazy(() => import('./pages/dashboard/admin/EventTeamEdit')),
);

// Event pages

const TeamEdit = Loadable(
  lazy(() => import('./pages/dashboard/team/TeamEdit')),
);

// Storefront pages

const Storefront = Loadable(lazy(() => import('./pages/dashboard/Storefront')));

// Error pages

const AuthorizationRequired = Loadable(
  lazy(() => import('./pages/AuthorizationRequired')),
);
const NotFound = Loadable(lazy(() => import('./pages/NotFound')));
const ServerError = Loadable(lazy(() => import('./pages/ServerError')));

// Other pages

const DashboardLayout = Loadable(
  lazy(() => import('./components/dashboard/DashboardLayout')),
);

const routes = (auth, participant, activeTeamMember) => [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element:
          auth.isAuthenticated && auth.user.user_role_grants?.includes('ui') ? (
            <Overview />
          ) : (
            <AuthorizationRequired />
          ),
      },
      {
        path: 'account',
        element:
          auth.isAuthenticated && auth.user.user_role_grants?.includes('ui') ? (
            <Account />
          ) : (
            <AuthorizationRequired />
          ),
      },
      {
        path: 'marketplace',
        element:
          auth.isAuthenticated &&
          auth.user.user_role_grants?.includes('organization_write') ? (
            <Storefront />
          ) : (
            <AuthorizationRequired />
          ),
      },
      {
        path: 'organization',
        children: [
          {
            path: 'events',
            element:
              auth.isAuthenticated &&
              auth.user.user_role_grants?.includes('ui') ? (
                <Events />
              ) : (
                <AuthorizationRequired />
              ),
          },
        ],
      },
      {
        path: 'resources',
        children: [
          {
            path: 'account/aws',
            element:
              auth.isAuthenticated &&
              activeTeamMember?.team_member_roles?.some(
                (role) =>
                  role.team_member_role_name === 'Player' ||
                  role.team_member_role_name === 'Captain',
              ) ? (
                <CloudAccount />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Team'
                  message='You must be a Team player or captain to access this page. Please contact a Team captain or an Event admin if you need access.'
                />
              ),
          },
        ],
      },
      {
        path: 'team',
        children: [
          {
            path: 'status',
            element:
              auth.isAuthenticated &&
              activeTeamMember?.team_member_roles?.some(
                (role) =>
                  role.team_member_role_name === 'Player' ||
                  role.team_member_role_name === 'Captain',
              ) ? (
                <ActiveTeamOverview />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Team'
                  message='You must be a Team player or captain to access this page. Please contact a Team captain or an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'resources/account/aws',
            element:
              auth.isAuthenticated &&
              activeTeamMember?.team_member_roles?.some(
                (role) =>
                  role.team_member_role_name === 'Player' ||
                  role.team_member_role_name === 'Captain',
              ) ? (
                <CloudAccount />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Team'
                  message='You must be a Team player or captain to access this page. Please contact a Team captain or an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'kanban',
            element:
              auth.isAuthenticated &&
              activeTeamMember?.team_member_roles?.some(
                (role) =>
                  role.team_member_role_name === 'Player' ||
                  role.team_member_role_name === 'Captain',
              ) ? (
                <Kanban />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Team'
                  message='You must be a Team player or captain to access this page. Please contact a Team captain or an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'manage',
            element:
              auth.isAuthenticated &&
              activeTeamMember?.team_member_roles?.some(
                (role) => role.team_member_role_name === 'Captain',
              ) ? (
                <TeamManage />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Team'
                  message='You must be a Team captain to access this page. Please contact an Event admin if you need access.'
                />
              ),
          },
        ],
      },
      {
        path: 'event',
        children: [
          {
            path: '',
            element:
              auth.isAuthenticated &&
              participant?.participant_roles?.length > 0 ? (
                <ActiveEventOverview />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Event'
                  message='You must be an active Event participant to access this page. Please contact an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'teams',
            element:
              auth.isAuthenticated &&
              participant?.participant_roles?.length > 0 ? (
                <EventTeams />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Event'
                  message='You must be an active Event participant to access this page. Please contact an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'leaderboard',
            element:
              auth.isAuthenticated &&
              participant?.participant_roles?.length > 0 ? (
                <LeaderBoard />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Event'
                  message='You must be an active Event participant to access this page. Please contact an Event admin if you need access.'
                />
              ),
          },
          {
            path: 'manage',
            element:
              auth.isAuthenticated &&
              participant?.participant_roles?.some(
                (role) => role.participant_role_name === 'Manager',
              ) ? (
                <EventManage />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Event'
                  message='You must be an Event manager to access this page. Please contact an Event admin if you need access.'
                />
              ),
          },
          {
            path: ':eventUuid',
            element:
              auth.isAuthenticated &&
              auth.user.user_role_grants?.includes('organization_read') ? (
                <InactiveEventOverview />
              ) : (
                <AuthorizationRequired />
              ),
          },
        ],
      },
      {
        path: 'judging',
        element:
          auth.isAuthenticated &&
          participant?.participant_roles?.some(
            (role) => role.participant_role_name === 'Judge',
          ) ? (
            <EventJudging />
          ) : (
            <AuthorizationRequired
              title='Unauthorized for Event'
              message='You must be an Event judge to access this page. Please contact an Event admin if you need access.'
            />
          ),
      },
      {
        path: 'admin',
        children: [
          {
            path: 'organization',
            element:
              auth.isAuthenticated &&
              auth.user.user_role_grants?.includes('organization_write') ? (
                <Organization />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Organization'
                  message='You must be an Organization admin to access this page. Please contact an Organization owner if you need access.'
                />
              ),
          },
          {
            path: 'users',
            element:
              auth.isAuthenticated &&
              auth.user.user_role_grants?.includes('organization_write') ? (
                <Users />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Organization'
                  message='You must be an Organization admin to access this page. Please contact an Organization owner if you need access.'
                />
              ),
          },
          {
            path: 'events',
            children: [
              {
                path: '',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('organization_write') ? (
                    <EventsManage />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Organization'
                      message='You must be an Organization admin to access this page. Please contact an Organization owner if you need access.'
                    />
                  ),
              },
              {
                path: 'create',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('organization_write') ? (
                    <EventCreate />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Organization'
                      message='You must be an Organization admin to access this page. Please contact an Organization owner if you need access.'
                    />
                  ),
              },
              {
                path: ':eventUuid',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('organization_write') ? (
                    <EventEdit />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Organization'
                      message='You must be an Organization admin to access this page. Please contact an Organization owner if you need access.'
                    />
                  ),
              },
              {
                path: ':eventUuid/teams/:teamUuid',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <EventTeamEdit />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
              {
                path: ':eventUuid/judging_criterion/create',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <JudgingCriterionCreate />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
              {
                path: ':eventUuid/judging_criterion/:judgingCriterionUuid',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <JudgingCriterionEdit />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
            ],
          },
          {
            path: 'judging',
            children: [
              {
                path: '',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <JudgingCriterionCreate />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
              {
                path: 'criterion/create',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <JudgingCriterionCreate />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
              {
                path: 'criterion/:judgingCriterionUuid',
                element:
                  auth.isAuthenticated &&
                  auth.user.user_role_grants?.includes('event_write') ? (
                    <JudgingCriterionEdit />
                  ) : (
                    <AuthorizationRequired
                      title='Unauthorized for Event'
                      message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                    />
                  ),
              },
            ],
          },
        ],
      },
      {
        path: 'event',
        children: [
          {
            path: 'manage',
            element:
              auth.isAuthenticated &&
              auth.user.user_role_grants?.includes('event_write') ? (
                <EventManage />
              ) : (
                <AuthorizationRequired
                  title='Unauthorized for Event'
                  message='You must be an Event manager to access this page. Please contact an Organization admin if you need access.'
                />
              ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <MainLayout />,
    children: [
      {
        path: '',
        skipLazyLoad: true,
        element: <Navigate to='dashboard' />,
      },
      {
        path: '401',
        element: <AuthorizationRequired />,
      },
      {
        path: '404',
        element: <NotFound />,
      },
      {
        path: '500',
        element: <ServerError />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export default routes;
