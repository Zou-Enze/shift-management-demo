import { Box, Grid, Typography } from '@mui/material';
import { useCountUp } from '../../hooks/useCountUp';
import type { ShiftSummary } from '../../types';

interface CardItemProps {
  label: string;
  value: number;
  unit: string;
  error?: boolean;
  muted?: boolean;
}

function CardItem({ label, value, unit, error, muted }: CardItemProps) {
  const animated = useCountUp(value, 800);
  return (
    <Box
      sx={{
        bgcolor: error ? 'error.light' : muted ? '#F6F6F6' : 'background.paper',
        color: 'text.primary',
        border: '1px solid',
        borderColor: error ? 'error.main' : muted ? '#BDBDBD' : 'divider',
        borderRadius: 1,
        p: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: error ? 'error.dark' : muted ? 'text.disabled' : 'text.secondary',
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
            color: error ? 'error.dark' : muted ? '#9E9E9E' : 'primary.main',
          }}
        >
          {animated}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: error ? 'error.dark' : muted ? '#9E9E9E' : 'text.primary',
          }}
        >
          {unit}
        </Typography>
      </Box>
    </Box>
  );
}

interface SummaryRowProps {
  summary: ShiftSummary;
  muted?: boolean;
}

function SummaryRow({ summary, muted }: SummaryRowProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <CardItem label="シフト割当人数" value={summary.total_assigned} unit="名" muted={muted} />
      </Grid>
      <Grid item xs={12} md={4}>
        <CardItem label="合計工数" value={summary.total_hours} unit="時間" muted={muted} />
      </Grid>
      <Grid item xs={12} md={4}>
        <CardItem
          label="未割当工数"
          value={summary.shortage_hours}
          unit="時間・人"
          error={!muted && summary.shortage_hours > 0}
          muted={muted}
        />
      </Grid>
    </Grid>
  );
}

interface Props {
  before: ShiftSummary;
  after: ShiftSummary;
}

export default function BeforeAfterCards({ before, after }: Props) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: 'text.secondary', mb: 2, fontSize: '15px', letterSpacing: '0.04em' }}
      >
        調整前後の比較
      </Typography>

      <Box sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.disabled', mb: 1, letterSpacing: '0.06em' }}>
          調整前
        </Typography>
        <SummaryRow summary={before} muted />
      </Box>

      <Box>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'primary.main', mb: 1, letterSpacing: '0.06em' }}>
          調整後
        </Typography>
        <SummaryRow summary={after} />
      </Box>
    </Box>
  );
}
