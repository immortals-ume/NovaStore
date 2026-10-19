import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { errorText } from '../api/client.js';
import { useMyOrders } from '../api/hooks.js';
import { DeliveryChip, EmptyState, ErrorState, Loading, PageTitle, PaymentChip } from '../components/common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatPrice, shortId } from '../lib.js';

/**
 * Form to change the user's name, email or password.
 */
function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError({ message: 'Passwords do not match.' });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: form.name, email: form.email, password: form.password });
      setForm((f) => ({ ...f, password: '', confirm: '' }));
      notify('Profile updated');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
      <Stack component="form" onSubmit={submit} sx={{ gap: 2 }}>
        <TextField label="Name" value={form.name} onChange={set('name')} required autoComplete="name" />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <TextField label="New password" type="password" value={form.password} onChange={set('password')} helperText="Leave blank to keep your current password. At least 8 characters." autoComplete="new-password" />
        {form.password && (
          <TextField label="Confirm new password" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        )}
        {error && <Alert severity="error">{errorText(error)}</Alert>}
        <Button type="submit" variant="contained" loading={saving} sx={{ alignSelf: 'flex-start' }}>Save changes</Button>
      </Stack>
    </Paper>
  );
}

/**
 * List of the user's orders with payment and delivery status.
 */
function OrderHistory() {
  const { data: orders, isLoading, error } = useMyOrders();
  const navigate = useNavigate();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!orders.length) {
    return (
      <Paper sx={{ border: 1, borderColor: 'divider' }}>
        <EmptyState
          icon={<ReceiptLongOutlinedIcon />}
          title="No orders yet"
          description="When you place an order it will show up here."
          action={<Button variant="contained" component={RouterLink} to="/shop">Start shopping</Button>}
        />
      </Paper>
    );
  }
  return (
    <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o._id}`)}>
              <TableCell sx={{ fontWeight: 600 }}>#{shortId(o._id)}</TableCell>
              <TableCell>{formatDate(o.createdAt)}</TableCell>
              <TableCell>{o.orderItems.reduce((n, i) => n + i.qty, 0)}</TableCell>
              <TableCell>{formatPrice(o.totalPrice)}</TableCell>
              <TableCell>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <PaymentChip order={o} />
                  {o.isPaid && <DeliveryChip order={o} />}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * /account - the user's profile and order history.
 */
export default function AccountPage() {
  const { user } = useAuth();
  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <PageTitle overline="My account" title={`Hi, ${user.name.split(' ')[0]}`} subtitle="Manage your details and track your orders." />
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}><ProfileForm /></Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Order history</Typography>
          <OrderHistory />
        </Grid>
      </Grid>
    </Container>
  );
}
