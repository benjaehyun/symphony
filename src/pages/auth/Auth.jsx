import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  initiateSpotifyAuth,
  loginUser,
  registerUser,
  clearAuthError,
  handleAuthSuccess 
} from '../../store/slices/authSlice';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent} from '../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const Auth = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    return () => {
      // Clear any errors when component unmounts
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const validateForm = (isLogin = false) => {
    const errors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Registration-specific validations
    if (!isLogin) {
      if (!formData.name) {
        errors.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAuthError = (error) => {
    // Handle specific error cases
    switch (error.toLowerCase()) {
      case 'invalid_credentials':
        return 'Invalid email or password';
      case 'email_exists':
        return 'An account with this email already exists';
      case 'network_error':
        return 'Unable to connect to the server. Please check your internet connection';
      case 'spotify_auth_failed':
        return 'Failed to connect to Spotify. Please try again';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm(true)) {
      return;
    }
  
    try {
      setIsSubmitting(true);
      await dispatch(loginUser({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      // Check Spotify auth status
      const result = await dispatch(handleAuthSuccess()).unwrap();
      if (!result.success) {
        // Only redirect if new OAuth is needed
        window.location.href = result.authUrl;
      } else {
        // Already have valid Spotify tokens, proceed to main app
        window.location.href = '/discover';
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm(false)) {
      return;
    }
  
    try {
      setIsSubmitting(true);
      await dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      // New users always need Spotify OAuth
      const { authUrl } = await dispatch(initiateSpotifyAuth()).unwrap();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || status === 'loading';

  return (
    <div className="w-full max-w-md">
        <Card className="shadow-lg ">
        <CardContent className="mt-12">
            <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {error && (
                <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {handleAuthError(error)}
                </AlertDescription>
                </Alert>
            )}

        <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={!!validationErrors.email}
                  />
                  {validationErrors.email && (
                    <span className="text-sm text-destructive">
                      {validationErrors.email}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={!!validationErrors.password}
                  />
                  {validationErrors.password && (
                    <span className="text-sm text-destructive">
                      {validationErrors.password}
                    </span>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
        </TabsContent>

            <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <div className="space-y-1">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                        id="register-name"
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!validationErrors.name}
                    />
                    {validationErrors.name && (
                        <span className="text-sm text-destructive">
                        {validationErrors.name}
                        </span>
                    )}
                    </div>

                    <div className="space-y-1">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                        id="register-email"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!validationErrors.email}
                    />
                    {validationErrors.email && (
                        <span className="text-sm text-destructive">
                        {validationErrors.email}
                        </span>
                    )}
                    </div>

                    <div className="space-y-1">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                        id="register-password"
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!validationErrors.password}
                    />
                    {validationErrors.password && (
                        <span className="text-sm text-destructive">
                        {validationErrors.password}
                        </span>
                    )}
                    </div>

                    <div className="space-y-1">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                        id="register-confirm-password"
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={!!validationErrors.confirmPassword}
                    />
                    {validationErrors.confirmPassword && (
                        <span className="text-sm text-destructive">
                        {validationErrors.confirmPassword}
                        </span>
                    )}
                    </div>
                </div>

                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                </form>
            </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>By continuing, you agree to Symphony's</p>
            <div className="space-x-1">
                <button className="underline hover:text-primary">Terms of Service</button>
                <span>and</span>
                <button className="underline hover:text-primary">Privacy Policy</button>
            </div>
            </div>
        </CardContent>
        </Card>
    </div>
    );
};

export default Auth;
