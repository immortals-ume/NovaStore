import { useState } from 'react';
import { useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { errorText } from '../../api/client.js';
import { useAllOrders, useDeleteOrder, useDeliverOrder } from '../../api/hooks.js';
import { DeliveryChip, ErrorState, Loading, PageTitle, PaymentChip } from '../../components/common.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice, shortId } from '../../lib.js';

const FILTERS = {
  all: () => true,
  unpaid: (o) => !o.isPaid,
  toShip: (o) => o.isPaid && !o.isDelivered,
  delivered: (o) => o.isDelivered,
};

/**
 * Dialog asking the admin to confirm deleting an order.
 * @param {{order: object | null, onClose: () => void}} props
 */
function ConfirmDelete({ order, onClose }) {
  const notify = useToast();
  const remove = useDeleteOrder();
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Delete order #{shortId(order._id)}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently removes the order{order.isDelivered ? '' : ' and returns its items to stock'}.
        </DialogContentText>
        {remove.error && <Alert severity="error" sx={{ mt: 2 }}>{errorText(remove.error)}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          loading={remove.isPending}
          onClick={() => remove.mutate(order._id, { onSuccess: () => { notify('Order deleted'); onClose(); } })}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * /admin/orders - all orders with status filters, mark-delivered and delete actions.
 */
export default function AdminOrdersPage() {
  const { data: orders, isLoading, error } = useAllOrders();
  const deliver = useDeliverOrder();
  const notify = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const counts = Object.fromEntries(Object.entries(FILTERS).map(([k, fn]) => [k, orders?.filter(fn).length ?? 0]));
  const visible = orders?.filter(FILTERS[filter]) ?? [];
  const revenue = orders?.filter((o) => o.isPaid).reduce((sum, o) => sum + o.totalPrice, 0) ?? 0;

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <PageTitle
        overline="Admin"
        title="Orders"
        subtitle={orders ? `${orders.length} orders · ${formatPrice(revenue)} paid revenue` : ' '}
      />

      <Tabs value={filter} onChange={(_e, v) => setFilter(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab value="all" label={`All (${counts.all})`} />
        <Tab value="unpaid" label={`Awaiting payment (${counts.unpaid})`} />
        <Tab value="toShip" label={`To ship (${counts.toShip})`} />
        <Tab value="delivered" label={`Delivered (${counts.delivered})`} />
      </Tabs>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((o) => (
                <TableRow key={o._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o._id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>#{shortId(o._id)}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography>{o.user?.name ?? 'Deleted user'}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{o.user?.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell align="right">{formatPrice(o.totalPrice)}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                      <PaymentChip order={o} />
                      {o.isPaid && <DeliveryChip order={o} />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    {o.isPaid && !o.isDelivered && (
                      <Tooltip title="Mark as delivered">
                        <IconButton
                          onClick={() => deliver.mutate(o._id, { onSuccess: () => notify('Order marked as delivered') })}
                          aria-label="Mark as delivered"
                        >
                          <LocalShippingOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton onClick={() => setDeleting(o)} aria-label="Delete order"><DeleteOutlinedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No orders here yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {deleting && <ConfirmDelete order={deleting} onClose={() => setDeleting(null)} />}
    </Container>
  );
}
