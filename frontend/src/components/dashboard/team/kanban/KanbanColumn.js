import { lazy, Suspense, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<CircularProgress />}>
    <Component {...props} />
  </Suspense>
);

const KanbanCard = Loadable(
  lazy(() => import('src/components/dashboard/team/kanban/KanbanCard')),
);
const KanbanCardAdd = Loadable(
  lazy(() => import('src/components/dashboard/team/kanban/KanbanCardAdd')),
);

const KanbanColumn = (props) => {
  const {
    activeCard,
    isSubmitting,
    setSubmitting,
    statusId,
    statusName,
    kanbanItems,
    ...other
  } = props;
  const theme = useTheme();

  const { setNodeRef } = useDroppable({
    id: statusId,
  });

  return (
    <div {...other}>
      <Paper
        ref={setNodeRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          mx: 1,
          overflowX: 'hidden',
          overflowY: 'hidden',
          width: {
            xs: 300,
            sm: 380,
          },
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            display: 'flex',
            px: 2,
            py: 1,
          }}
        >
          <Typography
            color='inherit'
            variant='h6'
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              px: 2,
              py: 1,
            }}
          >
            {statusName}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={kanbanItems?.length || '-'} />
        </Box>
        <Divider />
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 80,
            overflowY: 'auto',
            px: 2,
            py: 1,
          }}
        >
          <SortableContext
            id={statusId}
            items={kanbanItems}
            strategy={verticalListSortingStrategy}
          >
            <Box ref={setNodeRef} sx={{ hight: '100%' }}>
              {kanbanItems &&
                kanbanItems
                  ?.slice()
                  .sort(
                    (a, b) => a.kanban_item_priority - b.kanban_item_priority,
                  )
                  .map((item, index) => (
                    <KanbanCard
                      activeCard={activeCard}
                      isSubmitting={isSubmitting}
                      setSubmitting={setSubmitting}
                      key={item.kanban_item_uuid}
                      card={item}
                      index={index}
                    />
                  ))}
            </Box>
          </SortableContext>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <KanbanCardAdd
            statusId={statusId}
            isSubmitting={isSubmitting}
            setSubmitting={setSubmitting}
          />
        </Box>
      </Paper>
    </div>
  );
};

KanbanColumn.propTypes = {
  statusId: PropTypes.number.isRequired,
  statusName: PropTypes.string.isRequired,
  kanbanItems: PropTypes.array.isRequired,
};

export default KanbanColumn;
