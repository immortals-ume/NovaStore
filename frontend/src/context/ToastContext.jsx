import { createContext, use, useCallback, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, severity = 'success') => setToast({ message, severity, id: Date.now() }), []);
  const close = (_event, reason) => reason !== 'clickaway' && setToast(null);

  return (
    <ToastContext value={useMemo(() => notify, [notify])}>
      {children}
      <Snackbar
        key={toast?.id}
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity={toast?.severity ?? 'success'} variant="filled" sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext>
  );
}

export const useToast = () => use(ToastContext);
