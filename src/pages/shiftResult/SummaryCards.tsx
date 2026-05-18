import { Box, Grid, Typography } from '@mui/material';
import { useCountUp } from '../../hooks/useCountUp';
import type { ShiftSummary } from '../../types';

interface CardItemProps {
  label: string;
  value: number;
  unit: string;
  error?: boolean;
}

function CardItem({ label, value, unit, error }: CardItemProps) {
  const animated = useCountUp(value, 1000);
  return (
    <Box
      sx={{
        bgcolor: error ? 'error.light' : 'background.paper',
        color: 'text.primary',
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        p: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
        '&:hover': { borderColor: error ? 'error.dark' : 'primary.main' },
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: error ? 'error.dark' : 'text.secondary',
          mb: 2,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: error ? 'error.dark' : 'primary.main',
          }}
        >
          {animated}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: error ? 'error.dark' : 'text.primary',
          }}
        >
          {unit}
        </Typography>
      </Box>
    </Box>
  );
}

interface Props {
  summary: ShiftSummary;
}

export default function SummaryCards({ summary }: Props) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <CardItem label="シフト割当人数" value={summary.total_assigned} unit="名" />
      </Grid>
      <Grid item xs={12} md={4}>
        <CardItem label="合計工数" value={summary.total_hours} unit="時間" />
      </Grid>
      <Grid item xs={12} md={4}>
        <CardItem
          label="未割当工数"
          value={summary.shortage_hours}
          unit="時間・人"
          error={summary.shortage_hours > 0}
        />
      </Grid>
    </Grid>
  );
}
