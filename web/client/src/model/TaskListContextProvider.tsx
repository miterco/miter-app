import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SummaryItemWithContext, TaskListFilter} from 'miter-common/SharedTypes';
import {AuthenticatedRequestStatus} from '../ClientTypes';
import {fetchTaskList} from './SummaryApi';
import conn, {SocketConnectionListener} from '../SocketConnection';
import {log} from '../Utils';

const ReloadIntervalMin = 14;

interface TaskListContextValues {
  readonly tasks: SummaryItemWithContext[] | null;
  readonly filter: TaskListFilter;
  setFilter: (filter: TaskListFilter) => void;
  readonly showCompleted: boolean;
  setShowCompleted: (newShowCompleted: boolean) => void;
  readonly isLoading: boolean;
  loadTasks: () => void; // Loads or reloads the task lists, regardless of whether they've been loaded.
  reloadTasks: () => void; // Reloads the task lists if they've already been loaded.
}

const TaskListContext = React.createContext<TaskListContextValues | null>(null);
TaskListContext.displayName = 'Task List Context';

export const useTaskListContext = (): TaskListContextValues => {
  const values = React.useContext(TaskListContext);
  if (!values) throw new Error('Attempted to use TaskListContext values outside a TaskListContext.');

  return values;
};

const TaskListContextProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [tasks, setTasks] = useState<SummaryItemWithContext[] | null>(null);
  const [filter, setFilter] = useState<TaskListFilter>('MyTasks');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, _setIsLoading] = useState(true);
  const reloadTimer = useRef(0);
  const didInitiallyLoad = useRef(false);

  // handleUpdatedSummaryItems() gets passed outside the React context and thus doesn't get updates
  // to functions defined here. We give it a ref to our reload function to get around that.
  const reloadRef = useRef<() => void>();

  const loadTasks = useCallback(async () => {
    _setIsLoading(true);
    const newTasks = await fetchTaskList(filter, showCompleted);
    _setIsLoading(false);
    setTasks(newTasks);
    if (!didInitiallyLoad.current) didInitiallyLoad.current = true;
    if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(loadTasks, ReloadIntervalMin * 60 * 1000);
  }, [filter, showCompleted]);

  const reloadTasks = useCallback(async () => {
    log('Reloading tasks.');
    if (didInitiallyLoad.current) loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    reloadRef.current = reloadTasks;
  }, [reloadTasks]);

  // On mount...
  useEffect(() => {
    const handleUpdatedSummaryItems: SocketConnectionListener = () => {
      // (TODO) OK, this is a bit of a punt, but done in the spirit of MVP. When the server tells us there are new
      // summary items (tasks), probably the right thing to do is to merge those changes in with what we've got to
      // minimize data sent over the wire (and maybe reduce UI jitter). However, there's some complexity and tech debt
      // in making that happen:
      //
      // 1. The task list uses SummaryItemWithContext to get at data that regular SummaryItems don't need because they
      // have access to it via the meeting. We need to rationalize this, at a minimum bringing owner info into the in-
      // meeting version because people who aren't in the meeting can be assigned tasks. As for the rest (topic, etc),
      // a first guess is we make that optional on SummaryItemWithContext, use it when it's provided, don't when it's
      // not.
      //
      // 2. It's not simple CRUD with the task list. For example, if I reassign a task, it may need to disappear from
      // the list. (Bug still to be fixed: we have limited autocomplete info outside the context of a meeting, too,
      // so reassignment is kinda broken.)
      //
      // For now, then, we simply use the receipt of new summary items as a trigger to re-fetch the task list.
      //
      reloadRef.current && reloadRef.current();
    };

    conn.on('UpdatedSummaryItems', handleUpdatedSummaryItems);

    // On unmount...
    return () => {
      conn.off('UpdatedSummaryItems', handleUpdatedSummaryItems);
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
  }, []);

  useEffect(() => {
    reloadTasks();
  }, [reloadTasks, showCompleted]);

  const values: TaskListContextValues = {
    tasks,
    isLoading,
    loadTasks,
    reloadTasks,
    filter,
    setFilter,
    showCompleted,
    setShowCompleted,
  };

  return <TaskListContext.Provider value={values}>{children}</TaskListContext.Provider>;
};

export default TaskListContextProvider;
