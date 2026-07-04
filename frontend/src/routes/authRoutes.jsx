import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import { Route } from 'react-router-dom';

export const AuthRoutes = [
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
];

export const AuthRoutesComponent = () => (
  <>
    {AuthRoutes.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </>
);