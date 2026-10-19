import { Link as RouterLink, Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCatalog } from '../api/hooks.js';
import Header, { Logo } from './Header.jsx';
import CartDrawer from './CartDrawer.jsx';

/**
 * @param {{title: string, links: Array<{label: string, to: string}>}} props
 */

/**
 * Site footer with shop, help and account links.
 */
function FooterColumn({ title, links }) {
  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>{title}</Typography>
      {links.map(([label, to]) => (
        <Link key={to} component={RouterLink} to={to} color="text.primary" variant="body2">{label}</Link>
      ))}
    </Stack>
  );
}

function Footer() {
  const { data: catalog } = useCatalog();
  const departments = catalog?.departments ?? [];
  return (
    <Box component="footer" sx={{ mt: 10, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Logo />
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5, maxWidth: 360 }}>
              Thoughtfully made everyday clothing for women, men and kids. Fewer, better pieces that last.
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterColumn
              title="Shop"
              links={[['New arrivals', '/shop?sortOrder=newest'], ...departments.map((d) => [d.name, `/shop/${d.slug}`])]}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterColumn
              title="Popular"
              links={[
                ['Jeans', '/shop?category=jeans'],
                ['Dresses', '/shop?category=dresses'],
                ['Jackets & Coats', '/shop?category=outerwear'],
                ['Activewear', '/shop?category=activewear'],
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FooterColumn title="Account" links={[['My account', '/account'], ['Sign in', '/signin'], ['Create account', '/register']]} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>© {new Date().getFullYear()} NovaStore. All rights reserved.</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Secure checkout with PayPal</Typography>
        </Stack>
      </Container>
    </Box>
  );
}

/**
 * Page frame shared by every page: header, page content, footer and bag drawer.
 */
export default function Layout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
      <CartDrawer />
    </Box>
  );
}
