import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../lib.js';

export function ProductThumb({ src, alt, size = 88 }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ width: size, height: size * 1.25, objectFit: 'cover', borderRadius: 1.5, bgcolor: '#f2efea', flexShrink: 0 }}
    />
  );
}

export function QuantityStepper({ value, max, onChange, size = 'small' }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 999, width: 'fit-content' }}>
      <IconButton size={size} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }} aria-live="polite">{value}</Typography>
      <IconButton size={size} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <AddIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export default function CartLine({ item, onNavigate }) {
  const { setQty, remove } = useCart();
  return (
    <Stack direction="row" sx={{ gap: 2, py: 2 }}>
      <Link component={RouterLink} to={`/product/${item.product}`} onClick={onNavigate}>
        <ProductThumb src={item.image} alt={item.name} />
      </Link>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.brand}</Typography>
            <Link component={RouterLink} to={`/product/${item.product}`} onClick={onNavigate} color="text.primary" sx={{ display: 'block', fontWeight: 600 }}>
              {item.name}
            </Link>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.qty)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ mt: 'auto', pt: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <QuantityStepper value={item.qty} max={item.countInStock} onChange={(qty) => setQty(item.key, qty)} />
          <IconButton onClick={() => remove(item.key)} aria-label={`Remove ${item.name}`} size="small">
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
