import { lazy, Suspense, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import gtm from 'src/lib/gtm';
import { moveKanbanItem, updateKanbanItems } from 'src/slices/kanban';
import { useDispatch, useSelector } from 'src/store';
import { toast } from 'react-toastify';
import { getKanbanItems, postKanbanItems } from 'src/slices/kanban';
import { useTheme } from '@mui/material/styles';
import useSettings from 'src/hooks/useSettings';
import useAuth from 'src/hooks/useAuth';
import useStackRef from 'src/hooks/useStackRef';
import LoadingScreen from 'src/components/LoadingScreen';

const Loadable = (Component) => (props) => (
  <Suspense fallback={<CircularProgress />}>
    <Component {...props} />
  </Suspense>
);

const KanbanColumn = Loadable(
  lazy(() => import('src/components/dashboard/team/kanban/KanbanColumn')),
);
const KanbanCard = Loadable(
  lazy(() => import('src/components/dashboard/team/kanban/KanbanCard')),
);

const Kanban = (props) => {
  const { ...other } = props;

  const theme = useTheme();
  const { settings } = useSettings();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isLoading, setLoading] = useState(true);
  const kanban = useSelector((state) => state.kanban.data);
  const [activeCard, setActiveCard] = useState();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const {
    activeTeam,
    activeTeamMember,
    initializeTeamMembers,
    initializeUserParticipants,
  } = useStackRef();

  const submitKanbanItemChange = async (details) => {
    const { kanbanItem, newStatusId, newPriority } = details;

    setSubmitting(true);
    const payload = {};
    payload['user'] = user;
    payload['action'] = 'move';
    payload['team_uuid'] = activeTeam?.team_uuid;
    payload['kanban_item_uuid'] = kanbanItem.kanban_item_uuid;
    payload['kanban_item_status_id'] = newStatusId;
    payload['kanban_item_priority'] = newPriority;

    await dispatch(postKanbanItems(payload))
      .then((data) => {
        dispatch(
          getKanbanItems({ user: user, teamUuid: activeTeam?.team_uuid }),
        );
        toast.success('Card updated', { containerId: 'results' });
      })
      .catch((error) => {
        setSubmitting(false);
        throw new Error(error);
      });
    setSubmitting(false);
  };

  useEffect(() => {
    gtm.push({ event: 'page_view' });
  }, []);

  useEffect(() => {
    async function initialize() {
      if (user && activeTeam) {
        await initializeTeamMembers();
        dispatch(
          getKanbanItems({ user: user, teamUuid: activeTeam.team_uuid }),
        );
      }
    }
    initialize();
  }, [activeTeam, dispatch, initializeTeamMembers, user]);

  useEffect(() => {
    async function initialize() {
      if (!activeTeamMember) {
        await initializeUserParticipants();
      }
    }
    initialize();
  }, [activeTeamMember, initializeUserParticipants]);

  useEffect(() => {
    async function initialize() {
      if (user && activeTeam && activeTeamMember && kanban) {
        setLoading(false);
      }
    }
    initialize();
  }, [activeTeam, activeTeamMember, kanban, user]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
  );

  function findColumn(id) {
    if (
      kanban.kanban_item_statuses?.find(
        (status) => status.kanban_item_status_id === id,
      )
    )
      return id;

    return kanban.kanban_items.find((item) => item.kanban_item_uuid === id)
      ?.kanban_item_status_id;
  }

  function handleDragStart(event) {
    const { active } = event;
    const { id } = active;

    setActiveCard(
      kanban.kanban_items.find((item) => item.kanban_item_uuid === id),
    );
    setDraggedIndex(
      kanban.kanban_items.findIndex((item) => item.kanban_item_uuid === id),
    );
  }

  function handleDragOver(event) {
    const { active, over, draggingRect } = event;
    const { id } = active;
    const overId = over?.id;

    // Are we dragging into a blank space of a column?
    if (
      kanban.kanban_item_statuses?.find(
        (status) => status.kanban_item_status_id === overId,
      )
    )
      return;

    // Calculate the target index based on the position of the dragged card
    const overIndex = kanban.kanban_items.findIndex(
      (item) => item.kanban_item_uuid === overId,
    );
    const targetIndex = overIndex > draggedIndex ? overIndex + 1 : overIndex;

    // Create a new array with the updated card order
    const updatedKanbanItems = arrayMove(
      kanban.kanban_items,
      draggedIndex,
      targetIndex,
    );

    dispatch(updateKanbanItems(updatedKanbanItems));
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    const { id } = active;
    const overId = over?.id;

    const activeColumn = findColumn(id);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) return;

    const activeCard = kanban.kanban_items.find(
      (item) => item.kanban_item_uuid === id,
    );
    const overCard = kanban.kanban_items.find(
      (item) => item.kanban_item_uuid === overId,
    );

    if (activeCard !== overCard) {
      let newPriority = overCard?.kanban_item_priority || 1;
      if (overCard?.kanban_item_priority > activeCard.kanban_item_priority)
        newPriority = overCard.kanban_item_priority + 1;
      dispatch(
        moveKanbanItem({
          kanbanItem: activeCard,
          newStatusId: overColumn,
          newPriority: newPriority,
        }),
      );
      await submitKanbanItemChange({
        kanbanItem: activeCard,
        newStatusId: overColumn,
        newPriority: newPriority,
      });
    }

    setActiveCard(null);
  }

  return (
    <>
      <Helmet>
        <title>Kanban | Team | Dashboard | StackRef</title>
      </Helmet>
      <Box
        sx={{
          bgcolor: theme.palette.background.default,
          minHeight: '100%',
          py: 8,
        }}
      >
        <Container maxWidth={settings.compact ? 'xl' : false}>
          <Grid container justifyContent='space-between' spacing={3}>
            <Grid item>
              <Typography color='textPrimary' variant='h5'>
                Kanban
              </Typography>
              <Breadcrumbs
                aria-label='breadcrumb'
                separator={<ChevronRightIcon fontSize='small' />}
                sx={{ mt: 1 }}
              >
                <Link
                  color='textPrimary'
                  component={RouterLink}
                  to='/dashboard'
                  variant='subtitle2'
                >
                  Dashboard
                </Link>
                <Typography color='textPrimary' variant='subtitle2'>
                  Team
                </Typography>
                <Typography color='textSecondary' variant='subtitle2'>
                  Kanban
                </Typography>
              </Breadcrumbs>
            </Grid>
          </Grid>
          <Divider />
          {isLoading || !kanban.kanban_item_statuses ? (
            <LoadingScreen />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexGrow: 1,
                flexShrink: 1,
                height: '100vh',
                mt: 3,
                overflowX: 'auto',
                overflowY: 'hidden',
              }}
            >
              <DndContext
                autoScroll={{ acceleration: 1 }}
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {kanban.kanban_item_statuses.map((kanbanStatus) => (
                  <KanbanColumn
                    activeCard={activeCard}
                    isSubmitting={isSubmitting}
                    setSubmitting={setSubmitting}
                    statusId={kanbanStatus.kanban_item_status_id}
                    statusName={kanbanStatus.kanban_item_status_name}
                    kanbanItems={
                      kanban.kanban_items?.filter(
                        (item) =>
                          item.kanban_item_status_id ===
                          kanbanStatus.kanban_item_status_id,
                      ) || []
                    }
                    key={kanbanStatus.kanban_item_status_id}
                  />
                ))}
                <DragOverlay>
                  {activeCard ? (
                    <KanbanCard card={activeCard} isDragging />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

export default Kanban;
