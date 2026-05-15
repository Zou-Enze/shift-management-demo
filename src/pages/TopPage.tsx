import { Box, Grid, Card, CardActionArea, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ActionCard({ icon, label, disabled, onClick }: ActionCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid #DCD9D9',
        borderRadius: 1,
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.5 : 1,
        '&:hover': disabled
          ? {}
          : {
              transform: 'translateY(-4px)',
              boxShadow: '0 10px 15px -3px rgba(82,75,144,0.1), 0 4px 6px -2px rgba(82,75,144,0.05)',
              borderColor: 'primary.light',
            },
      }}
    >
      <CardActionArea
        disabled={disabled}
        onClick={onClick}
        sx={{
          height: '100%',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#F6F3F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.light',
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, color: 'text.primary' }}>
          {label}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function TopPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, md: 6 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 960 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <ActionCard
              icon={<AddIcon sx={{ fontSize: 40 }} />}
              label="新規シフト作成"
              onClick={() => navigate('/shift/create')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ActionCard icon={<EditIcon sx={{ fontSize: 40 }} />} label="既存シフト調整" disabled />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
