import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { errorText } from '../api/client.js';
import { useCreateOrder } from '../api/hooks.js';
import { ProductThumb } from '../components/CartLine.jsx';
import { EmptyState, SummaryRows } from '../components/common.jsx';
import { useCart } from '../context/CartContext.jsx';
import { estimateTotals, formatPrice } from '../lib.js';

const EMPTY_ADDRESS = { address: '', city: '', postalCode: '', country: '' };
const STEPS = ['Shipping', 'Review & pay'];

/**
 * Step 1: shipping address form.
 * @param {{initial?: object, onSubmit: (address: object) => void}} props
 */
function ShippingForm({ initial, onSubmit }) {
  const [form, setForm] = useState(initial ?? EMPTY_ADDRESS);
  const field = (name, label, props = {}) => (
    <TextField
      name={name}
      label={label}
      required
      value={form[name]}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      {...props}
    />
  );
  return (
    <Stack
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])));
      }}
      sx={{ gap: 2.5 }}
    >
      <Typography variant="h6">Where should we send it?</Typography>
      {field('address', 'Street address', { autoComplete: 'street-address' })}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>{field('city', 'City', { autoComplete: 'address-level2' })}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}</Grid>
      </Grid>
      {field('country', 'Country', { autoComplete: 'country-name' })}
      <Box>
        <Button type="submit" variant="contained" size="large">Continue to review</Button>
      </Box>
    </Stack>
  );
}

/**
 * Step 2: review address and items, then place the order.
 * @param {{shipping: object, items: object[], onEdit: () => void, onPlace: () => void, placing: boolean, error: unknown}} props
 */
function Review({ shipping, items, onEdit, onPlace, placing, error }) {
  return (
    <Stack sx={{ gap: 3 }}>
      <Paper sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Ship to</Typography>
            <Typography>{shipping.address}</Typography>
            <Typography>{shipping.city}, {shipping.postalCode}, {shipping.country}</Typography>
          </Box>
          <Button size="small" onClick={onEdit}>Edit</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Payment method</Typography>
        <FormControlLabel control={<Radio checked />} label="PayPal or card via PayPal" />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          You&rsquo;ll pay securely on the next screen after placing your order.
        </Typography>
      </Paper>

      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Items ({items.length})</Typography>
        <Stack divider={<Divider />}>
          {items.map((item) => (
            <Stack key={item.key} direction="row" sx={{ gap: 2, py: 1.5, alignItems: 'center' }}>
              <ProductThumb src={item.image} alt={item.name} size={56} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {[item.color, item.size && `Size ${item.size}`, `Qty ${item.qty}`].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
              <Typography>{formatPrice(item.price * item.qty)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {error && <Alert severity="error">{errorText(error)}</Alert>}
      <Box>
        <Button variant="contained" size="large" onClick={onPlace} loading={placing}>Place order</Button>
      </Box>
    </Stack>
  );
}

/**
 * /checkout - two-step checkout. Placing the order empties the bag and opens the order page for payment.
 */
export default function CheckoutPage() {
  const { items, shipping, saveShipping, clear } = useCart();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState(shipping ? 1 : 0);

  if (items.length === 0 && !createOrder.isSuccess) {
    return (
      <Container>
        <EmptyState
          icon={<ShoppingBagOutlinedIcon />}
          title="Your bag is empty"
          description="Add a few things you love, then come back to check out."
          action={<Button variant="contained" component={RouterLink} to="/shop">Start shopping</Button>}
        />
      </Container>
    );
  }

  const placeOrder = async () => {
    try {
      const order = await createOrder.mutateAsync({
        orderItems: items.map(({ product, qty, size }) => ({ product, qty, size })),
        shipping,
        payment: { paymentMethod: 'paypal' },
      });
      clear();
      navigate(`/orders/${order._id}?placed=1`, { replace: true });
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" component="h1">Checkout</Typography>
      <Stepper activeStep={step} sx={{ my: 4, maxWidth: 480 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          {step === 0 ? (
            <ShippingForm
              initial={shipping}
              onSubmit={(address) => {
                saveShipping(address);
                setStep(1);
              }}
            />
          ) : (
            <Review
              shipping={shipping}
              items={items}
              onEdit={() => setStep(0)}
              onPlace={placeOrder}
              placing={createOrder.isPending}
              error={createOrder.error}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, border: 1, borderColor: 'divider', position: { md: 'sticky' }, top: { md: 96 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order summary</Typography>
            <SummaryRows totals={estimateTotals(items)} estimate />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
