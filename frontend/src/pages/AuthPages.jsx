import { useState } from 'react';
import { Navigate, Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { errorText } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Only allow same-site paths so the redirect parameter cannot send users elsewhere.
const useRedirect = () => {
  const [params] = useSearchParams();
  const target = params.get('redirect') ?? '/';
  return target.startsWith('/') && !target.startsWith('//') ? target : '/';
};

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Container maxWidth="xs" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, border: 1, borderColor: 'divider' }}>
        <Typography variant="h4" component="h1">{title}</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>{subtitle}</Typography>
        {children}
      </Paper>
      <Typography sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>{footer}</Typography>
    </Container>
  );
}

function useSubmit(action) {
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const submit = async (...args) => {
    setPending(true);
    setError(null);
    try {
      await action(...args);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };
  return { submit, error, setError, pending };
}

export function SignInPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const [form, setForm] = useState({ email: '', password: '' });
  const { submit, error, pending } = useSubmit(async () => {
    await signIn(form.email, form.password);
    navigate(redirect, { replace: true });
  });

  if (user && !pending) return <Navigate to={redirect} replace />;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to check out faster and track your orders."
      footer={<>New to NovaStore? <Link component={RouterLink} to={`/register?redirect=${encodeURIComponent(redirect)}`}>Create an account</Link></>}
    >
      <Stack component="form" onSubmit={(e) => { e.preventDefault(); submit(); }} sx={{ gap: 2 }}>
        <TextField label="Email" type="email" required autoComplete="email" autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <Alert severity="error">{errorText(error)}</Alert>}
        <Button type="submit" variant="contained" size="large" loading={pending}>Sign in</Button>
      </Stack>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const redirect = useRedirect();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const { submit, error, setError, pending } = useSubmit(async () => {
    await register(form.name, form.email, form.password);
    navigate(redirect, { replace: true });
  });

  if (user && !pending) return <Navigate to={redirect} replace />;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join NovaStore for faster checkout and order tracking."
      footer={<>Already have an account? <Link component={RouterLink} to={`/signin?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link></>}
    >
      <Stack
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.password !== form.confirm) setError({ message: 'Passwords do not match.' });
          else submit();
        }}
        sx={{ gap: 2 }}
      >
        <TextField label="Full name" required autoComplete="name" autoFocus value={form.name} onChange={set('name')} />
        <TextField label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        <TextField label="Password" type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} helperText="At least 8 characters" slotProps={{ htmlInput: { minLength: 8 } }} />
        <TextField label="Confirm password" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        {error && <Alert severity="error">{errorText(error)}</Alert>}
        <Button type="submit" variant="contained" size="large" loading={pending}>Create account</Button>
      </Stack>
    </AuthCard>
  );
}
