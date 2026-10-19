import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCatalog } from '../api/hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export function Logo({ onClick }) {
  return (
    <Link component={RouterLink} to="/" onClick={onClick} underline="none" color="inherit" sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <Typography component="span" sx={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>
        nova
      </Typography>
      <Typography component="span" sx={{ fontWeight: 400, fontSize: 22, letterSpacing: '-0.04em', color: 'secondary.main' }}>
        store
      </Typography>
    </Link>
  );
}

function SearchBox({ onDone, autoFocus }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
    onDone?.();
  };
  return (
    <Paper
      component="form"
      onSubmit={submit}
      role="search"
      sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.25, borderRadius: 999, bgcolor: 'action.hover', width: '100%' }}
    >
      <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
      <InputBase
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search clothing or brands"
        autoFocus={autoFocus}
        sx={{ flex: 1, fontSize: 14 }}
        slotProps={{ input: { 'aria-label': 'Search products' } }}
      />
    </Paper>
  );
}

function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = mode === 'system' ? systemMode : mode;
  if (!current) return null;
  const next = current === 'dark' ? 'light' : 'dark';
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`}>
        {current === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const go = (path) => () => {
    setAnchor(null);
    navigate(path);
  };

  return (
    <>
      <Tooltip title={user ? user.name : 'Sign in'}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account">
          <PersonOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1, border: 1, borderColor: 'divider' } } }}
      >
        {user ? (
          [
            <Box key="who" sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user.name}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
            </Box>,
            <Divider key="d1" />,
            <MenuItem key="account" onClick={go('/account')}>
              <ListItemIcon><ReceiptLongOutlinedIcon fontSize="small" /></ListItemIcon>
              My account & orders
            </MenuItem>,
            user.isAdmin && <Divider key="d2" />,
            user.isAdmin && (
              <MenuItem key="ap" onClick={go('/admin/products')}>
                <ListItemIcon><Inventory2OutlinedIcon fontSize="small" /></ListItemIcon>
                Manage products
              </MenuItem>
            ),
            user.isAdmin && (
              <MenuItem key="ao" onClick={go('/admin/orders')}>
                <ListItemIcon><ReceiptLongOutlinedIcon fontSize="small" /></ListItemIcon>
                Manage orders
              </MenuItem>
            ),
            <Divider key="d3" />,
            <MenuItem
              key="out"
              onClick={() => {
                setAnchor(null);
                signOut();
                navigate('/');
              }}
            >
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Sign out
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="in" onClick={go('/signin')}>Sign in</MenuItem>,
            <MenuItem key="reg" onClick={go('/register')}>Create account</MenuItem>,
          ]
        )}
      </Menu>
    </>
  );
}

function MegaMenu({ department, onClose }) {
  return (
    <Paper
      square
      sx={{ position: 'absolute', top: '100%', left: 0, right: 0, borderBottom: 1, borderColor: 'divider', boxShadow: '0 24px 40px -24px rgba(0,0,0,0.25)' }}
    >
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ md: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>{department.name}</Typography>
            <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>Shop {department.name.toLowerCase()}&rsquo;s clothing</Typography>
            <Button component={RouterLink} to={`/shop/${department.slug}`} variant="contained" onClick={onClose}>
              View all {department.count}
            </Button>
          </Grid>
          <Grid size={{ md: 9 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>Categories</Typography>
            <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
              {department.categories.map((c) => (
                <Link
                  key={c.slug}
                  component={RouterLink}
                  to={`/shop/${department.slug}?category=${c.slug}`}
                  onClick={onClose}
                  color="text.primary"
                  sx={{ py: 0.75, display: 'flex', justifyContent: 'space-between', pr: 4 }}
                >
                  {c.name}
                  <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>{c.count}</Typography>
                </Link>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
}

function MobileNav({ open, onClose, departments }) {
  const { user } = useAuth();
  return (
    <Drawer open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 320 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Logo onClick={onClose} />
        <IconButton onClick={onClose} aria-label="Close menu"><CloseIcon /></IconButton>
      </Stack>
      <Box sx={{ px: 2, pb: 2 }}>
        <SearchBox onDone={onClose} />
      </Box>
      <Divider />
      <List dense>
        <ListItemButton component={RouterLink} to="/shop?sortOrder=newest" onClick={onClose}>
          <ListItemText primary="New arrivals" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
        </ListItemButton>
        {departments.map((d) => (
          <Box key={d.slug}>
            <ListSubheader sx={{ lineHeight: '36px', mt: 1 }}>{d.name}</ListSubheader>
            <ListItemButton component={RouterLink} to={`/shop/${d.slug}`} onClick={onClose}>
              <ListItemText primary={`All ${d.name.toLowerCase()}`} />
            </ListItemButton>
            {d.categories.filter((c) => c.count).map((c) => (
              <ListItemButton key={c.slug} component={RouterLink} to={`/shop/${d.slug}?category=${c.slug}`} onClick={onClose}>
                <ListItemText primary={c.name} />
              </ListItemButton>
            ))}
          </Box>
        ))}
      </List>
      <Divider />
      <List dense>
        {user ? (
          <ListItemButton component={RouterLink} to="/account" onClick={onClose}>
            <ListItemText primary="My account & orders" />
          </ListItemButton>
        ) : (
          <ListItemButton component={RouterLink} to="/signin" onClick={onClose}>
            <ListItemText primary="Sign in" />
          </ListItemButton>
        )}
      </List>
    </Drawer>
  );
}

export default function Header() {
  const { data: catalog } = useCatalog();
  const { count, openDrawer } = useCart();
  const [openDept, setOpenDept] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const departments = catalog?.departments ?? [];
  const active = departments.find((d) => d.slug === openDept);

  return (
    <>
      <Box sx={{ bgcolor: '#141414', color: '#f4f1ea', textAlign: 'center', py: 0.75, px: 2 }}>
        <Typography variant="caption" sx={{ letterSpacing: '0.04em' }}>
          Free shipping on orders over $100 · Easy 30-day returns
        </Typography>
      </Box>
      <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }} onMouseLeave={() => setOpenDept(null)}>
        <Container>
          <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 60, md: 68 } }}>
            <IconButton sx={{ display: { md: 'none' }, ml: -1 }} onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
            <Logo />
            <Stack direction="row" component="nav" aria-label="Departments" sx={{ display: { xs: 'none', md: 'flex' }, ml: 4, gap: 0.5 }}>
              <Button component={RouterLink} to="/shop?sortOrder=newest" color="inherit" onMouseEnter={() => setOpenDept(null)}>
                New in
              </Button>
              {departments.map((d) => (
                <Button
                  key={d.slug}
                  component={RouterLink}
                  to={`/shop/${d.slug}`}
                  color="inherit"
                  onMouseEnter={() => setOpenDept(d.slug)}
                  onFocus={() => setOpenDept(d.slug)}
                  onClick={() => setOpenDept(null)}
                  sx={{ bgcolor: openDept === d.slug ? 'action.hover' : undefined }}
                >
                  {d.name}
                </Button>
              ))}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, mr: 1 }} onMouseEnter={() => setOpenDept(null)}>
              <SearchBox />
            </Box>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileSearch((v) => !v)} aria-label="Search">
              <SearchIcon />
            </IconButton>
            <ColorModeToggle />
            <AccountMenu />
            <Tooltip title="Your bag">
              <IconButton onClick={openDrawer} aria-label={`Open bag, ${count} items`} sx={{ mr: -1 }}>
                <Badge badgeContent={count} color="secondary">
                  <ShoppingBagOutlinedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Toolbar>
          {mobileSearch && (
            <Box sx={{ pb: 1.5, display: { md: 'none' } }}>
              <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
            </Box>
          )}
        </Container>
        {active && (
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <MegaMenu department={active} onClose={() => setOpenDept(null)} />
          </Box>
        )}
      </AppBar>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} departments={departments} />
    </>
  );
}
