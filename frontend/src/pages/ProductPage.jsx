import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { errorText } from '../api/client.js';
import { useAddReview, useCatalog, useProduct, useProducts } from '../api/hooks.js';
import { ProductGrid } from '../components/ProductCard.jsx';
import { QuantityStepper } from '../components/CartLine.jsx';
import { EmptyState, ErrorState } from '../components/common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../lib.js';

/**
 * Product reviews and, for signed-in users, a form to add one.
 * @param {{product: object}} props
 */
function Reviews({ product }) {
  const { user } = useAuth();
  const notify = useToast();
  const addReview = useAddReview(product._id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const alreadyReviewed = user && product.reviews.some((r) => r.user === user._id);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addReview.mutateAsync({ rating, comment });
      setRating(0);
      setComment('');
      notify('Thanks for your review!');
    } catch {
      // Shown inline below.
    }
  };

  return (
    <Box sx={{ mt: { xs: 6, md: 10 } }}>
      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" component="h2">Customer reviews</Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 1.5 }}>
            <Rating value={product.rating} precision={0.5} readOnly />
            <Typography sx={{ color: 'text.secondary' }}>
              {product.numReviews ? `${product.rating.toFixed(1)} · ${product.numReviews} reviews` : 'No reviews yet'}
            </Typography>
          </Stack>
          <Box sx={{ mt: 3 }}>
            {!user ? (
              <Typography sx={{ color: 'text.secondary' }}>
                <Link component={RouterLink} to={`/signin?redirect=/product/${product._id}`}>Sign in</Link> to write a review.
              </Typography>
            ) : alreadyReviewed ? (
              <Alert severity="success" variant="outlined">You&rsquo;ve reviewed this item. Thank you!</Alert>
            ) : (
              <Stack component="form" onSubmit={submit} sx={{ gap: 2 }}>
                <Typography variant="subtitle1">Write a review</Typography>
                <Rating value={rating} onChange={(_e, v) => setRating(v ?? 0)} size="large" aria-label="Your rating" />
                <TextField
                  label="Your review"
                  multiline
                  minRows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
                {addReview.error && <Alert severity="error">{errorText(addReview.error)}</Alert>}
                <Button type="submit" variant="contained" disabled={!rating || !comment.trim()} loading={addReview.isPending}>
                  Submit review
                </Button>
              </Stack>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          {product.reviews.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', pt: 1 }}>Be the first to share what you think.</Typography>
          ) : (
            <Stack divider={<Divider />} sx={{ gap: 3 }}>
              {[...product.reviews].reverse().map((r) => (
                <Box key={r._id}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Rating value={r.rating} readOnly size="small" />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatDate(r.createdAt)}</Typography>
                  </Stack>
                  <Typography sx={{ mt: 1 }}>{r.comment}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>— {r.name}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Other products from the same department and category.
 * @param {{product: object}} props
 */
function RelatedProducts({ product }) {
  const { data } = useProducts({ department: product.department, category: product.category, pageSize: 5 });
  const { data: more } = useProducts({ department: product.department, sortOrder: 'rating', pageSize: 9 });
  const related = [...(data?.products ?? []), ...(more?.products ?? [])]
    .filter((p, i, arr) => p._id !== product._id && arr.findIndex((x) => x._id === p._id) === i)
    .slice(0, 4);
  if (!related.length) return null;
  return (
    <Box sx={{ mt: { xs: 6, md: 10 } }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>You may also like</Typography>
      <ProductGrid products={related} />
    </Box>
  );
}

/**
 * /product/:id - renders the product page, keyed by id so the chosen size and
 * quantity reset when moving between products.
 */
export default function ProductRoute() {
  const { id } = useParams();
  return <ProductPage key={id} id={id} />;
}

/**
 * Product details with size and quantity pickers and an add-to-bag button.
 * @param {{id: string}} props - Product id.
 */
function ProductPage({ id }) {
  const { data: product, isLoading, error } = useProduct(id);
  const { data: catalog } = useCatalog();
  const { add } = useCart();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  if (isLoading) {
    return (
      <Container sx={{ py: 5 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 7 }}><Skeleton variant="rounded" sx={{ aspectRatio: '4 / 5', height: 'auto' }} /></Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton width="30%" /><Skeleton height={56} /><Skeleton width="20%" height={40} /><Skeleton variant="rounded" height={200} sx={{ mt: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }
  if (error?.status === 404) {
    return (
      <Container>
        <EmptyState title="Product not found" description="It may have been removed or the link is wrong." action={<Button variant="contained" component={RouterLink} to="/shop">Browse the shop</Button>} />
      </Container>
    );
  }
  if (error) return <Container><ErrorState error={error} /></Container>;

  const dept = catalog?.departments.find((d) => d.slug === product.department);
  const category = catalog?.categories.find((c) => c.slug === product.category);
  const soldOut = product.countInStock <= 0;
  const needsSize = product.sizes.length > 0;

  const addToBag = () => {
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    add(product, { size: size ?? undefined, qty });
  };

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">Home</Link>
        {dept && <Link component={RouterLink} to={`/shop/${dept.slug}`} color="inherit">{dept.name}</Link>}
        {dept && category && (
          <Link component={RouterLink} to={`/shop/${dept.slug}?category=${category.slug}`} color="inherit">{category.name}</Link>
        )}
        <Typography sx={{ color: 'text.primary' }}>{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#f2efea', aspectRatio: '4 / 5', position: { md: 'sticky' }, top: { md: 96 } }}>
            <Box component="img" src={product.image} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>{product.brand}</Typography>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>{product.name}</Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mt: 1.5 }}>
            <Typography variant="h5" component="p">{formatPrice(product.price)}</Typography>
            {product.numReviews > 0 && (
              <Link href="#reviews" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={product.rating} precision={0.5} size="small" readOnly />
                {product.numReviews} reviews
              </Link>
            )}
          </Stack>

          {product.color && (
            <Typography sx={{ mt: 3 }}>
              <Box component="span" sx={{ color: 'text.secondary' }}>Colour: </Box>{product.color}
            </Typography>
          )}

          {needsSize && (
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: sizeError ? 'error.main' : 'text.primary' }}>
                  {sizeError ? 'Please select a size' : size ? `Size: ${size}` : 'Select a size'}
                </Typography>
              </Stack>
              <ToggleButtonGroup
                exclusive
                value={size}
                onChange={(_e, v) => {
                  setSize(v);
                  setSizeError(false);
                }}
                aria-label="Size"
                sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { border: 1, borderColor: sizeError ? 'error.main' : 'divider', borderRadius: '10px !important', minWidth: 64, py: 1.25 } }}
              >
                {product.sizes.map((s) => (
                  <ToggleButton key={s} value={s} disabled={soldOut}>{s}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          <Stack direction="row" sx={{ gap: 2, mt: 4, alignItems: 'center' }}>
            {!soldOut && <QuantityStepper value={qty} max={product.countInStock} onChange={setQty} size="medium" />}
            <Button variant="contained" size="large" fullWidth disabled={soldOut} onClick={addToBag}>
              {soldOut ? 'Sold out' : 'Add to bag'}
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1.5, color: soldOut ? 'error.main' : product.countInStock <= 10 ? 'warning.main' : 'success.main' }}>
            {soldOut ? 'Currently out of stock' : product.countInStock <= 10 ? `Only ${product.countInStock} left` : 'In stock, ready to ship'}
          </Typography>

          <Stack sx={{ gap: 1.5, mt: 4, p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Stack direction="row" sx={{ gap: 1.5 }}>
              <LocalShippingOutlinedIcon fontSize="small" />
              <Typography variant="body2">Free shipping on orders over $100</Typography>
            </Stack>
            <Stack direction="row" sx={{ gap: 1.5 }}>
              <AutorenewIcon fontSize="small" />
              <Typography variant="body2">Free returns within 30 days</Typography>
            </Stack>
          </Stack>

          <Box sx={{ mt: 3 }}>
            <Accordion defaultExpanded disableGutters sx={{ bgcolor: 'transparent', border: 0, borderTop: 1, borderColor: 'divider', '&::before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Description</Typography></AccordionSummary>
              <AccordionDetails><Typography sx={{ color: 'text.secondary' }}>{product.description}</Typography></AccordionDetails>
            </Accordion>
            <Accordion disableGutters sx={{ bgcolor: 'transparent', border: 0, borderTop: 1, borderBottom: 1, borderColor: 'divider', '&::before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1">Shipping & returns</Typography></AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: 'text.secondary' }}>
                  Orders ship within 2 business days. Shipping is free over $100, otherwise a flat $10. Return unworn items within 30 days for a full refund.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>
      </Grid>

      <Box id="reviews">
        <Reviews product={product} />
      </Box>
      <RelatedProducts product={product} />
    </Container>
  );
}
