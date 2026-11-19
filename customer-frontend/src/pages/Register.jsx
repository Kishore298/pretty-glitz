import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Register
 *
 * Registration is unified seamlessly with the Mobile OTP authentication system.
 * Any new customer is automatically registered on their first OTP verification.
 */
const Register = () => {
  return <Navigate to="/login" replace />;
};

export default Register;
