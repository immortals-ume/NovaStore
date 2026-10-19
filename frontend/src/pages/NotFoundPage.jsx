import { Link as RouterLink } from 'react-router';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { EmptyState } from '../components/common.jsx';

export default function NotFoundPage() {
  return (
    <Container>
      <EmptyState
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        action={<Button variant="contained" component={RouterLink} to="/">Back to home</Button>}
      />
    </Container>
  );
}
