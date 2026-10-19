import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatPrice } from '../lib.js';

export function ProductCard({ product }) {
  const soldOut = product.countInStock <= 0;
  const lowStock = !soldOut && product.countInStock <= 10;
  return (
    <Box
      component={RouterLink}
      to={`/product/${product._id}`}
      sx={{
        display: 'block',
        color: 'inherit',
        textDecoration: 'none',
        '&:hover img, &:focus-visible img': { transform: 'scale(1.04)' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 2 },
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, bgcolor: '#f2efea', aspectRatio: '4 / 5' }}>
        <Box
          component="img"
          src={product.image}
          alt={product.name}
          loading="lazy"
          sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s ease', opacity: soldOut ? 0.55 : 1 }}
        />
        {(soldOut || lowStock) && (
          <Chip
            label={soldOut ? 'Sold out' : 'Low stock'}
            size="small"
            sx={{ position: 'absolute', top: 12, left: 12, bgcolor: soldOut ? '#141414' : '#ffffff', color: soldOut ? '#ffffff' : '#141414' }}
          />
        )}
      </Box>
      <Stack sx={{ pt: 1.5, gap: 0.25 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {product.brand}
        </Typography>
        <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{product.name}</Typography>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
          <Typography sx={{ fontWeight: 600 }}>{formatPrice(product.price)}</Typography>
          {product.numReviews > 0 && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <Rating value={product.rating} precision={0.5} size="small" readOnly />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>({product.numReviews})</Typography>
            </Stack>
          )}
        </Stack>
        {product.color && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{product.color}</Typography>
        )}
      </Stack>
    </Box>
  );
}

const columns = { xs: 6, sm: 4, md: 3 };

export function ProductGrid({ products, loading, skeletons = 8, size = columns }) {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }} rowSpacing={{ xs: 3, md: 5 }}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => (
            <Grid key={i} size={size}>
              <Skeleton variant="rounded" sx={{ aspectRatio: '4 / 5', height: 'auto', borderRadius: 2 }} />
              <Skeleton width="40%" sx={{ mt: 1.5 }} />
              <Skeleton width="80%" />
              <Skeleton width="30%" />
            </Grid>
          ))
        : products.map((product) => (
            <Grid key={product._id} size={size}>
              <ProductCard product={product} />
            </Grid>
          ))}
    </Grid>
  );
}
