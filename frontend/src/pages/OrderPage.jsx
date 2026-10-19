import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { errorText } from '../api/client.js';
import { useDeliverOrder, useOrder, usePayOrder, usePaypalClientId } from '../api/hooks.js';
import { ProductThumb } from '../components/CartLine.jsx';
import { BackLink, DeliveryChip, EmptyState, ErrorState, Loading, PaymentChip, SummaryRows } from '../components/common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatPrice, shortId } from '../lib.js';

function PaymentPanel({ order }) {
  const notify = useToast();
  const pay = usePayOrder(order._id);
  const { data: clientId, isLoading } = usePaypalClientId();

  const confirm = async (orderID) => {
    await pay.mutateAsync({ orderID });
    notify('Payment received — thank you!');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Pay {formatPrice(order.totalPrice)}</Typography>
      {pay.error && <Alert severity="error" sx={{ mb: 2 }}>{errorText(pay.error)}</Alert>}
      {isLoading ? (
        <Loading label="Loading PayPal" />
      ) : (
        <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
            disabled={pay.isPending}
            createOrder={(_data, actions) =>
              actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [{ amount: { currency_code: 'USD', value: order.totalPrice.toFixed(2) } }],
              })
            }
            onApprove={async (data, actions) => {
              await actions.order.capture();
              await confirm(data.orderID).catch(() => {});
            }}
            onError={() => notify('PayPal could not complete the payment. Please try again.', 'error')}
          />
        </PayPalScriptProvider>
      )}
      {import.meta.env.DEV && (
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
          loading={pay.isPending}
          onClick={() => confirm(`DEV-${crypto.randomUUID()}`).catch(() => {})}
        >
          Simulate payment (development only)
        </Button>
      )}
    </Box>
  );
}

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const notify = useToast();
  const { data: order, isLoading, error } = useOrder(id);
  const deliver = useDeliverOrder();

  if (isLoading) return <Loading />;
  if (error?.status === 404) {
    return (
      <Container>
        <EmptyState title="Order not found" description="Check the link, or find your orders in your account." action={<Button variant="contained" component={RouterLink} to="/account">My orders</Button>} />
      </Container>
    );
  }
  if (error) return <Container><ErrorState error={error} /></Container>;

  const isOwner = order.user === user._id || order.user?._id === user._id;

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <BackLink to={user.isAdmin && !isOwner ? '/admin/orders' : '/account'}>
        {user.isAdmin && !isOwner ? 'All orders' : 'My orders'}
      </BackLink>

      {params.get('placed') && !order.isPaid && (
        <Alert icon={<CheckCircleOutlinedIcon />} severity="success" sx={{ mb: 3 }}>
          Order placed! Complete payment below and we&rsquo;ll start preparing your items.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1">Order #{shortId(order._id)}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>Placed {formatDate(order.createdAt)}</Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <PaymentChip order={order} />
          <DeliveryChip order={order} />
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
            <Stack divider={<Divider />}>
              {order.orderItems.map((item) => (
                <Stack key={item._id} direction="row" sx={{ gap: 2, py: 2, alignItems: 'center' }}>
                  <ProductThumb src={item.image} alt={item.name} size={64} />
                  <Box sx={{ flex: 1 }}>
                    <Link component={RouterLink} to={`/product/${item.product}`} color="text.primary" sx={{ fontWeight: 600 }}>{item.name}</Link>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {[item.size && `Size ${item.size}`, `${item.qty} × ${formatPrice(item.price)}`].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600 }}>{formatPrice(item.qty * item.price)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Shipping address</Typography>
                <Typography sx={{ mt: 1 }}>{order.shipping.address}</Typography>
                <Typography>{order.shipping.city}, {order.shipping.postalCode}</Typography>
                <Typography>{order.shipping.country}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Payment</Typography>
                <Typography sx={{ mt: 1, textTransform: 'capitalize' }}>{order.payment.paymentMethod}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{order.isPaid ? `Paid ${formatDate(order.paidAt)}` : 'Not paid yet'}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, border: 1, borderColor: 'divider', position: { md: 'sticky' }, top: { md: 96 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
            <SummaryRows totals={order} />
            {!order.isPaid && isOwner && <PaymentPanel order={order} />}
            {user.isAdmin && order.isPaid && !order.isDelivered && (
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                loading={deliver.isPending}
                onClick={() => deliver.mutate(order._id, { onSuccess: () => notify('Order marked as delivered') })}
              >
                Mark as delivered
              </Button>
            )}
            {deliver.error && <Alert severity="error" sx={{ mt: 2 }}>{errorText(deliver.error)}</Alert>}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
