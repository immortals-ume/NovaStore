import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCart } from '../context/CartContext.jsx';
import { FREE_SHIPPING_THRESHOLD, estimateTotals, formatPrice } from '../lib.js';
import CartLine from './CartLine.jsx';

export default function CartDrawer() {
  const { items, count, drawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();
  const { itemsPrice } = estimateTotals(items);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - itemsPrice);

  return (
    <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 } } } }}>
      <Stack sx={{ height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
          <Typography variant="h6">Your bag {count > 0 && `(${count})`}</Typography>
          <IconButton onClick={closeDrawer} aria-label="Close bag" edge="end"><CloseIcon /></IconButton>
        </Stack>
        <Divider />

        {items.length === 0 ? (
          <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', px: 4, textAlign: 'center', gap: 2 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6">Your bag is empty</Typography>
            <Typography sx={{ color: 'text.secondary' }}>Find something you love — new styles land every week.</Typography>
            <Button variant="contained" component={RouterLink} to="/shop" onClick={closeDrawer}>Start shopping</Button>
          </Stack>
        ) : (
          <>
            <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {remaining > 0 ? (
                  <>You&rsquo;re <strong>{formatPrice(remaining)}</strong> away from free shipping</>
                ) : (
                  <>You&rsquo;ve unlocked <strong>free shipping</strong></>
                )}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (itemsPrice / FREE_SHIPPING_THRESHOLD) * 100)}
                color={remaining > 0 ? 'primary' : 'success'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Stack divider={<Divider />} sx={{ flex: 1, overflowY: 'auto', px: 3 }}>
              {items.map((item) => (
                <CartLine key={item.key} item={item} onNavigate={closeDrawer} />
              ))}
            </Stack>
            <Divider />
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="subtitle1">Subtotal</Typography>
                <Typography variant="subtitle1">{formatPrice(itemsPrice)}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Shipping and taxes calculated at checkout.
              </Typography>
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={() => {
                  closeDrawer();
                  navigate('/checkout');
                }}
              >
                Checkout
              </Button>
              <Button fullWidth sx={{ mt: 1 }} onClick={closeDrawer}>Continue shopping</Button>
            </Box>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
