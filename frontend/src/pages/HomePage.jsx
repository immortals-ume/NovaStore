import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import { useCatalog, useProducts } from '../api/hooks.js';
import { ProductGrid } from '../components/ProductCard.jsx';

/**
 * @param {object[]} products
 * @param {(product: object) => boolean} predicate
 * @returns {string | undefined} Image of the first matching product.
 */
const firstImage = (products, predicate) => products.find(predicate)?.image;

/**
 * Section title with a "view all" link.
 * @param {{title: string, to: string, linkLabel?: string}} props
 */
function SectionHeader({ title, to, linkLabel = 'View all' }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mb: 3 }}>
      <Typography variant="h4" component="h2">{title}</Typography>
      {to && (
        <Button component={RouterLink} to={to} endIcon={<ArrowForwardIcon />}>{linkLabel}</Button>
      )}
    </Stack>
  );
}

/**
 * Large banner at the top of the home page.
 * @param {{products: object[]}} props - Used to pick banner images.
 */
function Hero({ products }) {
  const picks = ['outerwear', 'dresses', 'knitwear'].map((c) => firstImage(products, (p) => p.category === c));
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 5, md: 8 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="overline" sx={{ color: 'secondary.main' }}>The new season edit</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 68 }, lineHeight: 1.02, mt: 1 }}>
              Everyday clothing, made to last.
            </Typography>
            <Typography variant="h6" component="p" sx={{ color: 'text.secondary', fontWeight: 400, mt: 3, maxWidth: 480 }}>
              Considered essentials for women, men and kids — soft fabrics, honest prices and fits you&rsquo;ll wear on repeat.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 4 }}>
              <Button component={RouterLink} to="/shop/women" variant="contained" size="large">Shop women</Button>
              <Button component={RouterLink} to="/shop/men" variant="outlined" size="large">Shop men</Button>
              <Button component={RouterLink} to="/shop/kids" size="large">Shop kids</Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 2, height: { xs: 360, md: 520 } }}>
              {picks.map((src, i) =>
                src ? (
                  <Box
                    key={src}
                    component="img"
                    src={src}
                    alt=""
                    sx={{ width: '100%', height: '100%', minHeight: 0, objectFit: 'cover', borderRadius: 3, gridRow: i === 0 ? 'span 2' : undefined, bgcolor: '#f2efea' }}
                  />
                ) : (
                  <Skeleton key={i} variant="rounded" sx={{ height: '100%', borderRadius: 3, gridRow: i === 0 ? 'span 2' : undefined }} />
                ),
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/**
 * Image tiles linking to each department.
 * @param {{departments: object[], products: object[]}} props
 */
function DepartmentTiles({ departments, products }) {
  const featured = { women: 'dresses', men: 'outerwear', kids: 'knitwear' };
  return (
    <Grid container spacing={2}>
      {departments.map((d) => (
        <Grid key={d.slug} size={{ xs: 12, sm: 4 }}>
          <Box
            component={RouterLink}
            to={`/shop/${d.slug}`}
            sx={{
              position: 'relative',
              display: 'block',
              borderRadius: 3,
              overflow: 'hidden',
              aspectRatio: { xs: '16 / 10', sm: '3 / 4' },
              bgcolor: '#f2efea',
              '&:hover img': { transform: 'scale(1.04)' },
            }}
          >
            <Box
              component="img"
              src={firstImage(products, (p) => p.department === d.slug && p.category === featured[d.slug]) ?? firstImage(products, (p) => p.department === d.slug)}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s ease' }}
            />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)' }} />
            <Stack sx={{ position: 'absolute', left: 24, bottom: 20, color: '#fff' }}>
              <Typography variant="h4" component="h3">{d.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{d.count} styles · Shop now →</Typography>
            </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Row of category tiles linking to the shop.
 * @param {{categories: object[], products: object[]}} props
 */
function CategoryStrip({ categories, products }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: { xs: '42%', sm: '24%', md: 'calc((100% - 9 * 16px) / 10)' },
        gap: 2,
        overflowX: 'auto',
        pb: 1,
        scrollSnapType: 'x mandatory',
      }}
    >
      {categories.filter((c) => c.count).map((c) => (
        <Box
          key={c.slug}
          component={RouterLink}
          to={`/shop?category=${c.slug}`}
          sx={{ textDecoration: 'none', color: 'inherit', scrollSnapAlign: 'start', '&:hover img': { transform: 'translateY(-4px)' } }}
        >
          <Box sx={{ borderRadius: '50%', overflow: 'hidden', aspectRatio: '1', bgcolor: '#f2efea' }}>
            <Box
              component="img"
              src={firstImage(products, (p) => p.category === c.slug)}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)', transition: 'transform .3s' }}
            />
          </Box>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1.25, fontWeight: 600 }}>{c.name}</Typography>
        </Box>
      ))}
    </Box>
  );
}

const PROMISES = [
  [LocalShippingOutlinedIcon, 'Free shipping over $100', 'Flat $10 on smaller orders.'],
  [AutorenewIcon, '30-day returns', 'Changed your mind? Send it back.'],
  [SpaOutlinedIcon, 'Better materials', 'Organic cotton, merino and linen.'],
  [LockOutlinedIcon, 'Secure checkout', 'Pay safely with PayPal.'],
];

/**
 * / - home page with banner, departments, categories and new arrivals.
 */
export default function HomePage() {
  const { data: catalog } = useCatalog();
  const { data: all, isLoading } = useProducts({ pageSize: 100 });
  const { data: newest, isLoading: newestLoading } = useProducts({ sortOrder: 'newest', pageSize: 8 });
  const products = all?.products ?? [];

  return (
    <>
      <Hero products={products} />

      <Container sx={{ mt: { xs: 6, md: 10 } }}>
        <SectionHeader title="Shop by category" to="/shop" linkLabel="All clothing" />
        {catalog && !isLoading ? (
          <CategoryStrip categories={catalog.categories} products={products} />
        ) : (
          <Skeleton variant="rounded" height={160} />
        )}
      </Container>

      <Container sx={{ mt: { xs: 6, md: 10 } }}>
        <SectionHeader title="New arrivals" to="/shop?sortOrder=newest" />
        <ProductGrid products={newest?.products ?? []} loading={newestLoading} />
      </Container>

      <Container sx={{ mt: { xs: 6, md: 10 } }}>
        <SectionHeader title="Shop by department" />
        {catalog && <DepartmentTiles departments={catalog.departments} products={products} />}
      </Container>

      <Container sx={{ mt: { xs: 6, md: 10 } }}>
        <Box sx={{ borderRadius: 4, bgcolor: '#141414', color: '#f4f1ea', px: { xs: 3, md: 8 }, py: { xs: 5, md: 7 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" sx={{ color: '#e0855d' }}>Under $50</Typography>
              <Typography variant="h3" component="h2" sx={{ mt: 1 }}>Great basics, small prices.</Typography>
              <Typography sx={{ mt: 1.5, opacity: 0.75, maxWidth: 520 }}>
                Tees, shorts and kidswear that work hard every day — all under fifty dollars.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { md: 'right' } }}>
              <Button component={RouterLink} to="/shop?maxPrice=50&sortOrder=lowest" size="large" variant="contained" sx={{ bgcolor: '#f4f1ea', color: '#141414', '&:hover': { bgcolor: '#ffffff' } }}>
                Shop under $50
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Container sx={{ mt: { xs: 6, md: 10 } }}>
        <Grid container spacing={3}>
          {PROMISES.map(([Icon, title, text]) => (
            <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Stack direction="row" sx={{ gap: 2, alignItems: 'flex-start' }}>
                <Icon sx={{ color: 'secondary.main', mt: 0.25 }} />
                <Box>
                  <Typography variant="subtitle1">{title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
