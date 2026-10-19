import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import { streamChat } from '../api/assistant.js';
import { errorText } from '../api/client.js';
import { useAssistantStatus } from '../api/hooks.js';
import { formatPrice } from '../lib.js';
import { ProductThumb } from './CartLine.jsx';

const STARTERS = ['Find me a warm jacket under $150', 'What should I wear for a summer wedding?', 'Kids jeans for a 6 year old'];
const MAX_HISTORY = 20;
const MAX_CHARS = 2000;

/**
 * Builds the conversation sent to the server: text only, newest messages, starting with the shopper.
 * @param {object[]} messages - Chat messages shown in the widget.
 * @returns {Array<{role: string, content: string}>}
 */
const toHistory = (messages) => {
  const history = messages
    .filter((m) => !m.error && m.content.trim())
    .map(({ role, content }) => ({ role, content: content.trim().slice(0, MAX_CHARS) }))
    .slice(-MAX_HISTORY);
  while (history.length && history[0].role !== 'user') history.shift();
  return history;
};

/**
 * Compact product card shown under an assistant reply, linking to the product page.
 * @param {{product: object}} props
 */
function ProductSuggestion({ product }) {
  return (
    <Box
      component={RouterLink}
      to={`/product/${product._id}`}
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        p: 1,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        color: 'inherit',
        textDecoration: 'none',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <ProductThumb src={product.image} alt={product.name} size={56} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {product.brand}
          {product.color ? ` · ${product.color}` : ''}
        </Typography>
        <Typography variant="body2">{product.countInStock > 0 ? formatPrice(product.price) : 'Sold out'}</Typography>
      </Box>
    </Box>
  );
}

/**
 * One chat bubble; assistant replies can include product suggestions.
 * @param {{message: {role: string, content: string, products?: object[], error?: boolean}, pending?: boolean}} props
 */
function MessageBubble({ message, pending }) {
  const mine = message.role === 'user';
  return (
    <Stack spacing={1} sx={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      {(message.content || pending) && (
        <Box
          sx={{
            maxWidth: '85%',
            px: 1.75,
            py: 1,
            borderRadius: 3,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            bgcolor: mine ? 'primary.main' : message.error ? 'error.light' : 'action.hover',
            color: mine ? 'primary.contrastText' : message.error ? 'error.contrastText' : 'text.primary',
          }}
        >
          <Typography variant="body2">{message.content || 'Thinking…'}</Typography>
        </Box>
      )}
      {message.products?.length > 0 && (
        <Stack spacing={1} sx={{ width: '85%' }}>
          {message.products.map((p) => (
            <ProductSuggestion key={p._id} product={p} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Floating AI shopping assistant: a button that opens a chat panel. Replies stream in
 * and can include product cards. Hidden when the assistant is not configured on the server.
 */
export default function ChatWidget() {
  const { data: status } = useAssistantStatus();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  // Stop any reply in progress when the widget unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  if (!status?.enabled) return null;

  /**
   * Applies a change to the assistant message currently being streamed (the last one).
   * @param {(message: object) => object} change
   */
  const updateReply = (change) =>
    setMessages((current) => [...current.slice(0, -1), change(current.at(-1))]);

  /**
   * Sends the shopper's message and streams the assistant's reply into the chat.
   * @param {string} text
   */
  const send = async (text) => {
    const content = text.trim();
    if (!content || streaming) return;
    const next = [...messages, { role: 'user', content }];
    setMessages([...next, { role: 'assistant', content: '', products: [] }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat(toHistory(next), {
        signal: controller.signal,
        onEvent: (event, data) => {
          if (event === 'text') updateReply((m) => ({ ...m, content: m.content + data.delta }));
          if (event === 'reset') updateReply((m) => ({ ...m, content: m.content.slice(0, -data.chars) }));
          if (event === 'products') updateReply((m) => ({ ...m, products: [...m.products, ...data.products] }));
          if (event === 'error') updateReply((m) => ({ ...m, content: data.message, error: true }));
        },
      });
    } catch (err) {
      if (!controller.signal.aborted) updateReply((m) => ({ ...m, content: errorText(err), error: true }));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  /** Clears the conversation, stopping any reply in progress. */
  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
  };

  return (
    <>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          role="dialog"
          aria-label="Shopping assistant"
          sx={{
            position: 'fixed',
            zIndex: (theme) => theme.zIndex.speedDial,
            right: { xs: 0, sm: 24 },
            bottom: { xs: 0, sm: 96 },
            width: { xs: '100%', sm: 380 },
            height: { xs: '100dvh', sm: 560 },
            maxHeight: { sm: 'calc(100dvh - 120px)' },
            borderRadius: { xs: 0, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <AutoAwesomeIcon color="primary" fontSize="small" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Nova</Typography>
              <Typography variant="caption" color="text.secondary">
                AI shopping assistant
              </Typography>
            </Box>
            <Tooltip title="New chat">
              <span>
                <IconButton size="small" onClick={reset} disabled={!messages.length} aria-label="Start a new chat">
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close assistant">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack ref={listRef} spacing={2} aria-live="polite" sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {messages.length === 0 ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Hi! I can help you find clothes, check sizes and compare prices. Try:
                </Typography>
                {STARTERS.map((s) => (
                  <Chip key={s} label={s} variant="outlined" onClick={() => send(s)} sx={{ alignSelf: 'flex-start' }} />
                ))}
              </Stack>
            ) : (
              messages.map((m, i) => (
                <MessageBubble key={i} message={m} pending={streaming && i === messages.length - 1} />
              ))
            )}
          </Stack>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about products, sizes, shipping…"
                size="small"
                fullWidth
                multiline
                maxRows={4}
                slotProps={{ htmlInput: { maxLength: MAX_CHARS, 'aria-label': 'Message' } }}
              />
              {streaming ? (
                <IconButton onClick={() => abortRef.current?.abort()} aria-label="Stop reply">
                  <StopCircleOutlinedIcon />
                </IconButton>
              ) : (
                <IconButton type="submit" color="primary" disabled={!input.trim()} aria-label="Send">
                  <SendIcon />
                </IconButton>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, textAlign: 'center' }}>
              AI replies can be wrong. Check details on the product page.
            </Typography>
          </Box>
        </Paper>
      </Slide>

      <Tooltip title={open ? 'Close assistant' : 'Ask Nova, our AI shopping assistant'} placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close assistant' : 'Open shopping assistant'}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: (theme) => theme.zIndex.speedDial,
            display: { xs: open ? 'none' : 'flex', sm: 'flex' },
          }}
        >
          {open ? <CloseIcon /> : <AutoAwesomeIcon />}
        </Fab>
      </Tooltip>
    </>
  );
}
