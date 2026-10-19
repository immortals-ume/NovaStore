import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { errorText } from '../../api/client.js';
import { uploadImage, useCatalog, useDeleteProduct, useProducts, useSaveProduct } from '../../api/hooks.js';
import { ProductThumb } from '../../components/CartLine.jsx';
import { ErrorState, Loading, PageTitle } from '../../components/common.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../lib.js';

const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
const sizesFor = (department) => (department === 'kids' ? KIDS_SIZES : ADULT_SIZES);

const blankProduct = {
  name: '',
  brand: '',
  department: 'women',
  category: 'tops',
  price: '',
  countInStock: '',
  color: '',
  sizes: ADULT_SIZES,
  image: '',
  description: '',
};

function ProductDialog({ product, catalog, onClose }) {
  const notify = useToast();
  const save = useSaveProduct();
  const [form, setForm] = useState(() => ({ ...blankProduct, ...product }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isNew = !product?._id;

  const categories = catalog.departments.find((d) => d.slug === form.department)?.categories ?? [];
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const changeDepartment = (e) => {
    const department = e.target.value;
    const allowed = catalog.departments.find((d) => d.slug === department).categories;
    setForm({
      ...form,
      department,
      category: allowed.some((c) => c.slug === form.category) ? form.category : allowed[0].slug,
      sizes: sizesFor(department),
    });
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      setForm((f) => ({ ...f, image: '' }));
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setUploadError(err);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const { _id, name, brand, department, category, price, countInStock, color, sizes, image, description } = form;
    try {
      await save.mutateAsync({ _id, name, brand, department, category, price, countInStock, color, sizes, image, description });
      notify(isNew ? 'Product created' : 'Product saved');
      onClose();
    } catch {
      // Shown in the dialog.
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { component: 'form', onSubmit: submit } }}>
      <DialogTitle>{isNew ? 'Add product' : `Edit ${product.name}`}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#f2efea', aspectRatio: '4 / 5', display: 'grid', placeItems: 'center' }}>
              {form.image ? (
                <Box component="img" src={form.image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{uploading ? 'Uploading…' : 'No image'}</Typography>
              )}
            </Box>
            <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadOutlinedIcon />} sx={{ mt: 1.5 }} loading={uploading}>
              Upload image
              <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} />
            </Button>
            {uploadError && <Alert severity="error" sx={{ mt: 1 }}>{errorText(uploadError)}</Alert>}
            <TextField label="Image URL" size="small" value={form.image} onChange={set('image')} required sx={{ mt: 1.5 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Stack sx={{ gap: 2 }}>
              <TextField label="Name" value={form.name} onChange={set('name')} required />
              <Stack direction="row" sx={{ gap: 2 }}>
                <TextField label="Brand" value={form.brand} onChange={set('brand')} required />
                <TextField label="Colour" value={form.color} onChange={set('color')} />
              </Stack>
              <Stack direction="row" sx={{ gap: 2 }}>
                <TextField select label="Department" value={form.department} onChange={changeDepartment}>
                  {catalog.departments.map((d) => <MenuItem key={d.slug} value={d.slug}>{d.name}</MenuItem>)}
                </TextField>
                <TextField select label="Category" value={form.category} onChange={set('category')}>
                  {categories.map((c) => <MenuItem key={c.slug} value={c.slug}>{c.name}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction="row" sx={{ gap: 2 }}>
                <TextField
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={set('price')}
                  required
                  slotProps={{ htmlInput: { min: 0, step: '0.01' }, input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                />
                <TextField label="Stock" type="number" value={form.countInStock} onChange={set('countInStock')} required slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Stack>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Available sizes</Typography>
                <ToggleButtonGroup
                  value={form.sizes}
                  onChange={(_e, sizes) => setForm({ ...form, sizes })}
                  size="small"
                  sx={{ flexWrap: 'wrap' }}
                >
                  {sizesFor(form.department).map((s) => <ToggleButton key={s} value={s} sx={{ px: 1.5 }}>{s}</ToggleButton>)}
                </ToggleButtonGroup>
              </Box>
              <TextField label="Description" value={form.description} onChange={set('description')} required multiline minRows={3} />
            </Stack>
          </Grid>
        </Grid>
        {save.error && <Alert severity="error" sx={{ mt: 2 }}>{errorText(save.error)}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" loading={save.isPending} disabled={uploading}>
          {isNew ? 'Create product' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDelete({ product, onClose }) {
  const notify = useToast();
  const remove = useDeleteProduct();
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Delete product?</DialogTitle>
      <DialogContent>
        <DialogContentText>&ldquo;{product.name}&rdquo; will be removed from the store. Existing orders keep their copy of it.</DialogContentText>
        {remove.error && <Alert severity="error" sx={{ mt: 2 }}>{errorText(remove.error)}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          loading={remove.isPending}
          onClick={() => remove.mutate(product._id, { onSuccess: () => { notify('Product deleted'); onClose(); } })}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminProductsPage() {
  const { data: catalog } = useCatalog();
  const { data, isLoading, error } = useProducts({ pageSize: 100, sortOrder: 'newest' });
  const [department, setDepartment] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const categoryName = (slug) => catalog?.categories.find((c) => c.slug === slug)?.name ?? slug;
  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.products ?? []).filter(
      (p) =>
        (department === 'all' || p.department === department) &&
        (!term || `${p.name} ${p.brand} ${p.color}`.toLowerCase().includes(term)),
    );
  }, [data, department, search]);

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <PageTitle
        overline="Admin"
        title="Products"
        subtitle={data ? `${data.total} products in the catalog` : ' '}
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})} disabled={!catalog}>Add product</Button>}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 2 }}>
        <Tabs value={department} onChange={(_e, v) => setDepartment(v)}>
          <Tab value="all" label="All" />
          {catalog?.departments.map((d) => <Tab key={d.slug} value={d.slug} label={d.name} />)}
        </Tabs>
        <TextField
          size="small"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { sm: 280 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Stack>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 2, alignItems: 'center', py: 0.5 }}>
                      <ProductThumb src={p.image} alt="" size={40} />
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{[p.brand, p.color].filter(Boolean).join(' · ')}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{p.department}</TableCell>
                  <TableCell>{categoryName(p.category)}</TableCell>
                  <TableCell align="right">{formatPrice(p.price)}</TableCell>
                  <TableCell align="right" sx={{ color: p.countInStock === 0 ? 'error.main' : p.countInStock <= 10 ? 'warning.main' : 'text.primary', fontWeight: 600 }}>
                    {p.countInStock}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit"><IconButton onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}><DeleteOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No products match.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && catalog && <ProductDialog product={editing._id ? editing : null} catalog={catalog} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDelete product={deleting} onClose={() => setDeleting(null)} />}
    </Container>
  );
}
