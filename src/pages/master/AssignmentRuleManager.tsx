import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  TextField,
  Typography,
  IconButton,
  Button,
  Tooltip,
  styled,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../../db/database';
import type { AssignmentRule } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';

function newId(): string {
  const num = Math.floor(Math.random() * 900 + 100);
  return `R${num}`;
}

const GreenSwitch = styled(Switch)(() => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#fff',
    '& + .MuiSwitch-track': {
      backgroundColor: '#4caf50',
      opacity: 1,
    },
  },
  '& .MuiSwitch-switchBase': {
    color: '#fff',
    '& + .MuiSwitch-track': {
      backgroundColor: '#ef9a9a',
      opacity: 1,
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#fff',
  },
}));

type RowDraft = AssignmentRule & { dirty?: boolean };

export default function AssignmentRuleManager() {
  const dbRules = useLiveQuery(() => db.assignment_rules.orderBy('priority').toArray(), []) ?? [];

  // local draft state: keyed by id
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getRow = (rule: AssignmentRule): RowDraft => drafts[rule.id] ?? rule;

  const setField = <K extends keyof AssignmentRule>(id: string, key: K, value: AssignmentRule[K]) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? dbRules.find((r) => r.id === id)!), [key]: value, dirty: true },
    }));
  };

  const handleToggle = async (rule: AssignmentRule) => {
    const draft = getRow(rule);
    const newEnabled = !draft.enabled;
    setDrafts((prev) => ({
      ...prev,
      [rule.id]: { ...draft, enabled: newEnabled, dirty: true },
    }));
    // toggle auto-saves immediately
    await db.assignment_rules.update(rule.id, { enabled: newEnabled });
    setDrafts((prev) => {
      const next = { ...prev };
      if (next[rule.id]) next[rule.id] = { ...next[rule.id], dirty: false };
      return next;
    });
  };

  const handleSave = async (rule: AssignmentRule) => {
    const draft = getRow(rule);
    await db.assignment_rules.put({ ...draft, dirty: undefined } as AssignmentRule);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[rule.id];
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await db.assignment_rules.delete(deletingId);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[deletingId];
      return next;
    });
    setDeletingId(null);
  };

  const handleAdd = async () => {
    const maxPriority = dbRules.length > 0 ? Math.max(...dbRules.map((r) => r.priority)) : 0;
    const newRule: AssignmentRule = {
      id: newId(),
      content: '',
      description: '',
      settingValue: '',
      hasInput: true,
      priority: maxPriority + 1,
      enabled: false,
    };
    await db.assignment_rules.add(newRule);
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, width: 90, color: 'text.secondary' }}>ルールID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ルール内容</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 120, color: 'text.secondary' }}>設定値</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 80, color: 'text.secondary', textAlign: 'center' }}>優先度</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 140, color: 'text.secondary', textAlign: 'center' }}>適用要否</TableCell>
              <TableCell sx={{ width: 96 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {dbRules.map((rule) => {
              const row = getRow(rule);
              const isDirty = !!drafts[rule.id]?.dirty;
              return (
                <TableRow
                  key={rule.id}
                  sx={{
                    '&:last-child td': { border: 0 },
                    '&:hover': { backgroundColor: 'grey.50' },
                    backgroundColor: isDirty ? 'warning.50' : undefined,
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                      {rule.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.hasInput ? (
                      <TextField
                        size="small"
                        value={row.settingValue}
                        onChange={(e) => setField(rule.id, 'settingValue', e.target.value)}
                        sx={{ width: 90 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled', pl: 1 }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={row.priority}
                      onChange={(e) => setField(rule.id, 'priority', Number(e.target.value))}
                      sx={{ width: 60 }}
                      inputProps={{ style: { textAlign: 'center' }, min: 1 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>off</Typography>
                      <GreenSwitch
                        checked={row.enabled}
                        onChange={() => handleToggle(rule)}
                        size="small"
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>on</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', pr: 1 }}>
                    <Tooltip title="保存">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleSave(rule)}
                        disabled={!isDirty}
                      >
                        <SaveOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletingId(rule.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ fontWeight: 600 }}
        >
          行を追加
        </Button>
      </Box>

      <ConfirmDialog
        open={!!deletingId}
        title="ルールの削除"
        message="このルールを削除します。この操作は取り消せません。続行しますか？"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </Box>
  );
}
