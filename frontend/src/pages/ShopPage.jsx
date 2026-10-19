import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import TuneIcon from '@mui/icons-material/Tune';
import { useCatalog, useProducts } from '../api/hooks.js';
import { ProductGrid } from '../components/ProductCard.jsx';
import { EmptyState, ErrorState } from '../components/common.jsx';
import { formatPrice } from '../lib.js';

const PAGE_SIZE = 12;
const PRICE_MAX = 250;
const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
const SORTS = [
  ['', 'Featured'],
  ['newest', 'Newest'],
  ['lowest', 'Price: low to high'],
  ['highest', 'Price: high to low'],
  ['rating', 'Top rated'],
];

/**
 * Titled group inside the filter panel.
 * @param {{title: string, children: React.ReactNode}} props
 */
function FilterSection({ title, children }) {
  return (
    <Box sx={{ py: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

/**
 * Category, size and price filters. Filter values live in the URL.
 * @param {{categories: object[], sizes: string[], params: URLSearchParams, setParam: Function, clearAll: () => void}} props
 */
function Filters({ categories, sizes, params, setParam, clearAll }) {
  const category = params.get('category') ?? '';
  const size = params.get('size') ?? '';
  const min = Number(params.get('minPrice') ?? 0);
  const max = Number(params.get('maxPrice') ?? PRICE_MAX);
  const [price, setPrice] = useState([min, max]);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Filters</Typography>
        <Button size="small" onClick={clearAll}>Clear all</Button>
      </Stack>
      <Divider sx={{ mt: 1 }} />
      <FilterSection title="Category">
        <List dense disablePadding sx={{ mx: -1 }}>
          <ListItemButton selected={!category} onClick={() => setParam('category', '')} sx={{ borderRadius: 1.5 }}>
            <ListItemText primary="All categories" />
          </ListItemButton>
          {categories.map((c) => (
            <ListItemButton
              key={c.slug}
              selected={category === c.slug}
              disabled={!c.count}
              onClick={() => setParam('category', c.slug)}
              sx={{ borderRadius: 1.5 }}
            >
              <ListItemText primary={c.name} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.count}</Typography>
            </ListItemButton>
          ))}
        </List>
      </FilterSection>
      <Divider />
      <FilterSection title="Size">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sizes.map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setParam('size', size === s ? '' : s)}
              variant={size === s ? 'filled' : 'outlined'}
              color={size === s ? 'primary' : 'default'}
              sx={{ minWidth: 52 }}
            />
          ))}
        </Box>
      </FilterSection>
      <Divider />
      <FilterSection title="Price">
        <Box sx={{ px: 1 }}>
          <Slider
            value={price}
            onChange={(_e, v) => setPrice(v)}
            onChangeCommitted={(_e, [lo, hi]) => {
              setParam({ minPrice: lo > 0 ? lo : '', maxPrice: hi < PRICE_MAX ? hi : '' });
            }}
            min={0}
            max={PRICE_MAX}
            step={10}
            disableSwap
            getAriaLabel={(i) => (i === 0 ? 'Minimum price' : 'Maximum price')}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
          />
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatPrice(price[0])}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {price[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(price[1])}
          </Typography>
        </Stack>
      </FilterSection>
    </Box>
  );
}

/**
 * /shop and /shop/:department - product list with filters, sorting, search and paging.
 */
export default function ShopPage() {
  const { department = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: catalog } = useCatalog();

  const query = {
    department,
    category: params.get('category') ?? '',
    size: params.get('size') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    searchKeyword: params.get('q') ?? '',
    sortOrder: params.get('sortOrder') ?? '',
    page: Number(params.get('page') ?? 1),
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, error, refetch } = useProducts(query);

  const dept = catalog?.departments.find((d) => d.slug === department);
  const categories = dept ? dept.categories : catalog?.categories ?? [];
  const categoryName = catalog?.categories.find((c) => c.slug === query.category)?.name;
  const sizes = department === 'kids' ? KIDS_SIZES : department ? ADULT_SIZES : [...ADULT_SIZES, ...KIDS_SIZES];
  const title = query.searchKeyword
    ? `Results for “${query.searchKeyword}”`
    : [dept?.name, categoryName].filter(Boolean).join(' · ') || 'All clothing';

  const setParam = (keyOrObject, value) => {
    const updates = typeof keyOrObject === 'string' ? { [keyOrObject]: value } : keyOrObject;
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in updates)) next.delete('page');
    setParams(next);
  };
  const clearAll = () => {
    const next = new URLSearchParams();
    if (query.searchKeyword) next.set('q', query.searchKeyword);
    setParams(next);
  };

  const activeChips = [
    query.category && [categoryName ?? query.category, () => setParam('category', '')],
    query.size && [`Size ${query.size}`, () => setParam('size', '')],
    (query.minPrice || query.maxPrice) && [
      `${formatPrice(query.minPrice || 0)} – ${query.maxPrice ? formatPrice(query.maxPrice) : 'any'}`,
      () => setParam({ minPrice: '', maxPrice: '' }),
    ],
    query.searchKeyword && [`“${query.searchKeyword}”`, () => setParam('q', '')],
  ].filter(Boolean);

  const filters = catalog && (
    <Filters
      key={`${department}-${params.get('minPrice')}-${params.get('maxPrice')}`}
      categories={categories}
      sizes={sizes}
      params={params}
      setParam={(...args) => {
        setParam(...args);
        setFiltersOpen(false);
      }}
      clearAll={clearAll}
    />
  );

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" color="inherit">Home</Link>
        <Link component={RouterLink} to="/shop" color="inherit">Shop</Link>
        {dept && <Link component={RouterLink} to={`/shop/${dept.slug}`} color="inherit">{dept.name}</Link>}
        {categoryName && <Typography sx={{ color: 'text.primary' }}>{categoryName}</Typography>}
      </Breadcrumbs>

      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, md: 44 } }}>{title}</Typography>

      <Tabs
        value={department || 'all'}
        onChange={(_e, v) => navigate({ pathname: v === 'all' ? '/shop' : `/shop/${v}`, search: query.searchKeyword ? `?q=${encodeURIComponent(query.searchKeyword)}` : '' })}
        sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab value="all" label="All" />
        {catalog?.departments.map((d) => <Tab key={d.slug} value={d.slug} label={d.name} />)}
      </Tabs>

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '240px 1fr' }, gap: { md: 5 }, mt: 3 }}>
        <Box component="aside" sx={{ display: { xs: 'none', md: 'block' } }}>{filters}</Box>

        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setFiltersOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              Filters
            </Button>
            <Typography sx={{ color: 'text.secondary', mr: 1 }} aria-live="polite">
              {data ? `${data.total} ${data.total === 1 ? 'item' : 'items'}` : ' '}
            </Typography>
            {activeChips.map(([label, onDelete]) => (
              <Chip key={label} label={label} onDelete={onDelete} size="small" />
            ))}
            <Box sx={{ flex: 1 }} />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                label="Sort by"
                value={query.sortOrder}
                onChange={(e) => setParam('sortOrder', e.target.value)}
              >
                {SORTS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !isLoading && data?.products.length === 0 ? (
            <EmptyState
              icon={<SearchOffIcon />}
              title="No matches"
              description="Try removing a filter or searching for something else."
              action={<Button variant="contained" onClick={clearAll}>Clear filters</Button>}
            />
          ) : (
            <Box sx={{ opacity: isFetching && !isLoading ? 0.6 : 1, transition: 'opacity .2s' }}>
              <ProductGrid products={data?.products ?? []} loading={isLoading} skeletons={6} size={{ xs: 6, sm: 4 }} />
            </Box>
          )}

          {data?.pageCount > 1 && (
            <Stack sx={{ alignItems: 'center', mt: 6 }}>
              <Pagination
                count={data.pageCount}
                page={query.page}
                onChange={(_e, page) => {
                  setParam('page', page === 1 ? '' : page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                shape="rounded"
              />
            </Stack>
          )}
        </Box>
      </Box>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} slotProps={{ paper: { sx: { width: 320, p: 3 } } }}>
        {filters}
      </Drawer>
    </Container>
  );
}
