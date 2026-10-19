import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, request } from './client.js';

export const useCatalog = () =>
  useQuery({ queryKey: ['catalog'], queryFn: () => api.get('/api/products/catalog'), staleTime: 5 * 60_000 });

const toQueryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  return search.toString();
};

export const useProducts = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: async ({ signal }) => {
      const { data, headers } = await request(`/api/products?${toQueryString(params)}`, { signal });
      return {
        products: data,
        total: Number(headers.get('X-Total-Count') ?? data.length),
        pageCount: Number(headers.get('X-Page-Count') ?? 1),
      };
    },
    placeholderData: keepPreviousData,
    ...options,
  });

export const useProduct = (id) =>
  useQuery({ queryKey: ['product', id], queryFn: () => api.get(`/api/products/${id}`), enabled: Boolean(id) });

export const useOrder = (id) =>
  useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/api/orders/${id}`), enabled: Boolean(id) });

export const useMyOrders = (enabled = true) =>
  useQuery({ queryKey: ['orders', 'mine'], queryFn: () => api.get('/api/orders/mine'), enabled });

export const useAllOrders = () => useQuery({ queryKey: ['orders', 'all'], queryFn: () => api.get('/api/orders') });

export const usePaypalClientId = () =>
  useQuery({ queryKey: ['paypal-client-id'], queryFn: () => api.get('/api/config/paypal'), staleTime: Infinity });

const useInvalidatingMutation = (mutationFn, keys) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
};

export const useCreateOrder = () =>
  useInvalidatingMutation((order) => api.post('/api/orders', order).then((r) => r.data), [['orders'], ['products'], ['product']]);

export const usePayOrder = (id) =>
  useInvalidatingMutation((payment) => api.put(`/api/orders/${id}/pay`, payment), [['order', id], ['orders']]);

export const useDeliverOrder = () =>
  useInvalidatingMutation((id) => api.put(`/api/orders/${id}/deliver`), [['order'], ['orders']]);

export const useDeleteOrder = () =>
  useInvalidatingMutation((id) => api.delete(`/api/orders/${id}`), [['orders'], ['products']]);

export const useSaveProduct = () =>
  useInvalidatingMutation(
    ({ _id, ...product }) => (_id ? api.put(`/api/products/${_id}`, product) : api.post('/api/products', product)),
    [['products'], ['product'], ['catalog']],
  );

export const useDeleteProduct = () =>
  useInvalidatingMutation((id) => api.delete(`/api/products/${id}`), [['products'], ['catalog']]);

export const useAddReview = (productId) =>
  useInvalidatingMutation((review) => api.post(`/api/products/${productId}/reviews`, review), [
    ['product', productId],
    ['products'],
  ]);

export const uploadImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return request('/api/uploads', { method: 'POST', body: form }).then((r) => r.data);
};
