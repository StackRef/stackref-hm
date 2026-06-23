import { lazy, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from 'src/hooks/useAuth';
import Login from 'src/pages/authentication/Login';

const SRRegistration = lazy(
  () => import('src/pages/authentication/SRRegistration'),
);
const CreateJoinOrganization = lazy(
  () => import('src/pages/organization/CreateJoinOrganization'),
);

const AuthGuard = (props) => {
  const { children } = props;
  const auth = useAuth();
  const location = useLocation();
  const [requestedLocation, setRequestedLocation] = useState(null);

  if (!auth.isAuthenticated) {
    if (location.pathname !== requestedLocation) {
      setRequestedLocation(location.pathname);
    }

    return <Login />;
  }

  // If the user hasn't completed our Registration form, force them to do so first
  else if (!auth.user.registered) {
    if (location.pathname !== requestedLocation) {
      setRequestedLocation(location.pathname);
    }

    return <SRRegistration />;
  }

  // If the user is not part of an Organization yet, prompt them to create one or join an existing one
  else if (!auth.user.organization_uuid) {
    console.log(auth.user);
    if (location.pathname !== requestedLocation) {
      setRequestedLocation(location.pathname);
    }

    return <CreateJoinOrganization />;
  }

  // This is done so that in case the route changes by any chance through other
  // means between the moment of request and the render we navigate to the initially
  // requested route.
  if (requestedLocation && location.pathname !== requestedLocation) {
    setRequestedLocation(null);
    return <Navigate to={requestedLocation} />;
  }

  return <>{children}</>;
};

AuthGuard.propTypes = {
  children: PropTypes.node,
};

export default AuthGuard;
