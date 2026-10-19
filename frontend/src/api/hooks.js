import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, request } from './client.js';

/**
 * Loads departments, categories and sizes with product counts (cached for 5 minutes).
 */
export const useCatalog = () =>
  useQuery({ queryKey: ['catalog'], queryFn: () => api.get('/api/products/catalog'), staleTime: 5 * 60_000 });

/**
 * Builds a URL query string, leaving out empty values.
 * @param {Record<string, unknown>} params
 * @returns {string} e.g. `category=jeans&page=2`.
 */
const toQueryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  return search.toString();
};

/**
 * Loads a page of products. Keeps showing the previous page while the next one loads.
 * @param {Record<string, unknown>} [params] - Filters, sort and paging sent to GET /api/products.
 * @param {object} [options] - Extra TanStack Query options.
 * @returns Query whose data is `{ products, total, pageCount }`.
 */

/**
 * Loads one product with its reviews. Does nothing until `id` is set.
 * @param {string} id - Product id.
 */
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

/**
 * Loads one order. Does nothing until `id` is set.
 * @param {string} id - Order id.
 */
export const useOrder = (id) =>
  useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/api/orders/${id}`), enabled: Boolean(id) });

/**
 * Loads the signed-in user's orders.
 * @param {boolean} [enabled] - Set false to skip loading (e.g. when signed out).
 */
export const useMyOrders = (enabled = true) =>
  useQuery({ queryKey: ['orders', 'mine'], queryFn: () => api.get('/api/orders/mine'), enabled });

/**
 * Loads every order (admin only).
 */
export const useAllOrders = () => useQuery({ queryKey: ['orders', 'all'], queryFn: () => api.get('/api/orders') });

/**
 * Loads the public PayPal client id used by the checkout button.
 */
export const usePaypalClientId = () =>
  useQuery({ queryKey: ['paypal-client-id'], queryFn: () => api.get('/api/config/paypal'), staleTime: Infinity });

/**
 * Wraps a mutation so that, on success, the given cached queries are refetched.
 * @param {(variables: any) => Promise<unknown>} mutationFn - The API call.
 * @param {unknown[][]} keys - Query keys whose data is now out of date.
 */
const useInvalidatingMutation = (mutationFn, keys) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
};

/**
 * Places an order; resolves to the created order. Refreshes orders and product stock.
 */
export const useCreateOrder = () =>
  useInvalidatingMutation((order) => api.post('/api/orders', order).then((r) => r.data), [['orders'], ['products'], ['product']]);

/**
 * Submits a PayPal payment for an order.
 * @param {string} id - Order id.
 */
export const usePayOrder = (id) =>
  useInvalidatingMutation((payment) => api.put(`/api/orders/${id}/pay`, payment), [['order', id], ['orders']]);

/**
 * Marks an order delivered (admin). Takes the order id.
 */
export const useDeliverOrder = () =>
  useInvalidatingMutation((id) => api.put(`/api/orders/${id}/deliver`), [['order'], ['orders']]);

/**
 * Deletes an order (admin). Takes the order id.
 */
export const useDeleteOrder = () =>
  useInvalidatingMutation((id) => api.delete(`/api/orders/${id}`), [['orders'], ['products']]);

/**
 * Creates a product, or updates it when the product has an `_id` (admin).
 */
export const useSaveProduct = () =>
  useInvalidatingMutation(
    ({ _id, ...product }) => (_id ? api.put(`/api/products/${_id}`, product) : api.post('/api/products', product)),
    [['products'], ['product'], ['catalog']],
  );

/**
 * Deletes a product (admin). Takes the product id.
 */
export const useDeleteProduct = () =>
  useInvalidatingMutation((id) => api.delete(`/api/products/${id}`), [['products'], ['catalog']]);

/**
 * Adds the signed-in user's review to a product.
 * @param {string} productId
 */
export const useAddReview = (productId) =>
  useInvalidatingMutation((review) => api.post(`/api/products/${productId}/reviews`, review), [
    ['product', productId],
    ['products'],
  ]);

/**
 * Uploads a product image (admin).
 * @param {File} file - JPEG, PNG, GIF or WebP, up to 5 MB.
 * @returns {Promise<string>} The public path of the uploaded image.
 */
export const uploadImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return request('/api/uploads', { method: 'POST', body: form }).then((r) => r.data);
};

/**
 * Checks whether the AI shopping assistant is switched on (cached for the session).
 */
export const useAssistantStatus = () =>
  useQuery({ queryKey: ['assistant-status'], queryFn: () => api.get('/api/assistant/status'), staleTime: Infinity, retry: false });
