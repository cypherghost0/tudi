"use client";

import { useState } from 'react';
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signUp, getAuthErrorMessage } from '@/app/lib/firebase/auth-utils';
import { useSettings } from '@/app/contexts/settings-context';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';

const SignUpSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .required('Display name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();

  const handleSubmit = async (values: { displayName: string; email: string; password: string; confirmPassword: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    // Check if signup is enabled
    if (!settings?.signupEnabled) {
      setError('User registration is currently disabled. Please contact an administrator.');
      setSubmitting(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signUp({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });

      router.push(`/dashboard`);
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Show loading state while settings are being fetched
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if signup is disabled
  const isSignupDisabled = !settings?.signupEnabled;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            {isSignupDisabled
              ? "User registration is currently disabled"
              : "Enter your information to create your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignupDisabled && (
            <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md mb-4">
              New user registration is currently disabled. Please contact an administrator for assistance.
            </div>
          )}
          <Formik
            initialValues={{
              displayName: '',
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={SignUpSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                  </label>
                  <Field
                    as={Input}
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Enter your display name"
                    disabled={isLoading || isSignupDisabled}
                  />
                  <ErrorMessage name="displayName" component="div" className="text-sm text-destructive" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Field
                    as={Input}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    disabled={isLoading || isSignupDisabled}
                  />
                  <ErrorMessage name="email" component="div" className="text-sm text-destructive" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Field
                    as={Input}
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    disabled={isLoading || isSignupDisabled}
                  />
                  <ErrorMessage name="password" component="div" className="text-sm text-destructive" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Field
                    as={Input}
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    disabled={isLoading || isSignupDisabled}
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="text-sm text-destructive" />
                </div>

                {error && (
                  <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isSubmitting || isSignupDisabled}
                >
                  {isSignupDisabled
                    ? 'Registration Disabled'
                    : isLoading
                    ? 'Creating Account...'
                    : 'Create Account'
                  }
                </Button>
              </Form>
            )}
          </Formik>

          <Separator className="my-6" />

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href={`/login`} className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 