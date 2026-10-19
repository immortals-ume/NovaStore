import { Link as RouterLink } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { errorText } from '../api/client.js';
import { formatDate, formatPrice } from '../lib.js';

/**
 * Centered spinner.
 * @param {{label?: string}} props - Text read by screen readers.
 */
export function Loading({ label = 'Loading' }) {
  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', py: 12 }} role="status" aria-label={label}>
      <CircularProgress size={32} />
    </Stack>
  );
}

/**
 * Error message with an optional retry button.
 * @param {{error: unknown, onRetry?: () => void}} props
 */
export function ErrorState({ error, onRetry }) {
  return (
    <Alert
      severity="error"
      sx={{ my: 4 }}
      action={onRetry && <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}
    >
      {errorText(error)}
    </Alert>
  );
}

/**
 * Placeholder shown when a list has nothing to show.
 * @param {{icon?: React.ReactNode, title: string, description?: string, action?: React.ReactNode}} props
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <Stack sx={{ alignItems: 'center', textAlign: 'center', py: 10, px: 2, gap: 1.5 }}>
      {icon && <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 56 } }}>{icon}</Box>}
      <Typography variant="h6">{title}</Typography>
      {description && <Typography sx={{ color: 'text.secondary', maxWidth: 420 }}>{description}</Typography>}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  );
}

/**
 * Page heading with optional small text above, subtitle and action button.
 * @param {{overline?: string, title: string, subtitle?: string, action?: React.ReactNode}} props
 */
export function PageTitle({ overline, title, subtitle, action }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 2, mb: 4 }}>
      <Box>
        {overline && <Typography variant="overline" sx={{ color: 'text.secondary' }}>{overline}</Typography>}
        <Typography variant="h4" component="h1">{title}</Typography>
        {subtitle && <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

/**
 * Paid / Not paid badge for an order.
 * @param {{order: object}} props
 */
export function PaymentChip({ order }) {
  return order.isPaid ? (
    <Chip size="small" color="success" label={`Paid ${formatDate(order.paidAt)}`} />
  ) : (
    <Chip size="small" color="warning" variant="outlined" label="Awaiting payment" />
  );
}

/**
 * Delivered / Not delivered badge for an order.
 * @param {{order: object}} props
 */
export function DeliveryChip({ order }) {
  return order.isDelivered ? (
    <Chip size="small" color="success" label={`Delivered ${formatDate(order.deliveredAt)}`} />
  ) : (
    <Chip size="small" variant="outlined" label={order.isPaid ? 'Preparing shipment' : 'Not shipped'} />
  );
}

/**
 * Price summary: items, shipping, tax and total.
 * @param {{totals: object, estimate?: boolean}} props - `estimate` labels the total as estimated.
 */
export function SummaryRows({ totals, estimate = false }) {
  const rows = [
    ['Subtotal', formatPrice(totals.itemsPrice)],
    ['Shipping', totals.shippingPrice === 0 ? 'Free' : formatPrice(totals.shippingPrice)],
    [`Tax (15%)${estimate ? ' — estimated' : ''}`, formatPrice(totals.taxPrice)],
  ];
  return (
    <Stack sx={{ gap: 1 }}>
      {rows.map(([label, value]) => (
        <Stack key={label} direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'text.secondary' }}>{label}</Typography>
          <Typography>{value}</Typography>
        </Stack>
      ))}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6">{formatPrice(totals.totalPrice)}</Typography>
      </Stack>
    </Stack>
  );
}

/**
 * Small "back" link with an arrow.
 * @param {{to: string, children: React.ReactNode}} props
 */
export function BackLink({ to, children }) {
  return (
    <Button component={RouterLink} to={to} size="small" sx={{ ml: -1.5, mb: 2 }}>
      ← {children}
    </Button>
  );
}
