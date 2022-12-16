import {Dropdown, Empty, Menu, Spin} from 'antd';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTaskListContext} from '../model/TaskListContextProvider';
import Card from './Card';
import SummaryItemView from 'core-components/SummaryView/SummaryItemView';
import './TaskList.less';
import {ReactComponent as ErrorIcon} from '../image/error.svg';
import {ReactComponent as CheckIcon} from '../image/check-narrow.svg';
import {ReactComponent as FilterIcon} from '../image/filter.svg';
import {ReactComponent as NoIcon} from '../image/empty.svg';
import classNames from 'classnames';
import Button, {ButtonSize, ButtonType, ButtonVariant} from '../basic-components/Button';
import {useMiterContext} from 'model/MiterContextProvider';
import {IntroSteps, IntroStepStrings as S} from 'core-components/IntroSteps';
import {AddIcon} from 'image';
import AddTaskModal from './AddTaskModal/AddTaskModal';
import {getUserPreference} from 'model/UserPrefs';
import {StrInviteColleagues} from 'miter-common/Strings';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';

const TaskList: React.FC<{}> = () => {
  const {setShowSignInDialog, linkedServices, signInState} = useMiterContext();
  const {showInviteColleaguesModal, shouldShowInviteColleaguesCTA, colleagues} = useInviteColleaguesContext();
  const {tasks, loadTasks, filter, setFilter, showCompleted, setShowCompleted, isLoading} = useTaskListContext();
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // TODO The next few functions are basically copy-pasted from SummaryCard...which makes me wonder about a hook...
  const handleAddClick = () => setShowAddTask(true);
  const addButton = useMemo(
    () => (
      <Button
        key="add"
        type={ButtonType.borderless}
        title="Add a personal task"
        onClick={handleAddClick}
        icon={<AddIcon />}
        disabled={signInState !== 'SignedIn'}
      />
    ),
    [signInState]
  );

  const listContent = useMemo(() => {
    if (isLoading) return <Spin delay={150} size="large" tip="Loading your action items..." />;

    switch (signInState) {
      case 'SignedIn':
        if (tasks?.length) {
          return tasks?.map((task, i) => (
            <SummaryItemView item={task.summaryItem} owner={task.owner} context={task} key={i} />
          ));
        } else if (shouldShowInviteColleaguesCTA && linkedServices?.GoogleCalendar && colleagues.length > 0) {
          return (
            <div className="SignInCard Large">
              <h3>Invite Your Colleagues</h3>
              <p>{StrInviteColleagues.InviteColleaguesCTADescription}</p>
              <Button onClick={showInviteColleaguesModal} size={ButtonSize.large} type={ButtonType.primary}>
                Invite Now
              </Button>
            </div>
          );
        } else {
          return (
            <div className="SignInCard Large">
              <h3>Six Steps to Miter</h3>
              <IntroSteps
                stepContent={[
                  S.SelectFromMeetingList,
                  S.AddGoal,
                  S.TakeNotes,
                  S.CollectOutcomes,
                  S.ReceiveSummary,
                  S.TaskList,
                ]}
              />
            </div>
          );
        }

      case 'SignedOut':
        return (
          <div className="SignInCard Large">
            <h3>Welcome to Miter!</h3>
            <p>
              Sign in for the full Miter experience: you'll see your meetings from Google Calendar, action items
              assigned to you, summaries from past meetings, and more right here in our dashboard.
            </p>
            <Button
              type={ButtonType.primary}
              variant={ButtonVariant.outline}
              size={ButtonSize.large}
              onClick={() => setShowSignInDialog(true)}
            >
              Sign Up / Sign In
            </Button>
          </div>
        );

      default:
        return (
          <Empty
            className="Empty Error"
            image={<ErrorIcon />}
            description="There was an error loading your action items."
          />
        );
    }
  }, [
    signInState,
    isLoading,
    tasks,
    setShowSignInDialog,
    showInviteColleaguesModal,
    shouldShowInviteColleaguesCTA,
    linkedServices?.GoogleCalendar,
    colleagues.length,
  ]);

  const handleFilterSelect = useCallback(
    (key: string) => {
      switch (key) {
        case 'ShowMyTasks':
          setFilter('MyTasks');
          break;

        case 'ShowMyMeetings':
          setFilter('MyMeetings');
          break;

        case 'ToggleCompleted':
          setShowCompleted(!showCompleted);
          break;

        default:
          console.error(`Got unexpected task list filter: ${key}`);
          break;
      }
    },
    [setFilter, showCompleted, setShowCompleted]
  );

  const filterButton = useMemo(() => {
    const menu = (
      <Menu className="TaskList_FilterMenu" onClick={opts => handleFilterSelect(opts.key)}>
        <Menu.Item key="ShowMyTasks" icon={filter === 'MyTasks' ? <CheckIcon /> : <NoIcon />}>
          My Action Items
        </Menu.Item>
        <Menu.Item key="ShowMyMeetings" icon={filter === 'MyMeetings' ? <CheckIcon /> : <NoIcon />}>
          Action Items in My Meetings
        </Menu.Item>
        <Menu.Divider key="d0" />
        <Menu.Item key="ToggleCompleted" icon={showCompleted ? <CheckIcon /> : <NoIcon />}>
          Show Completed
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown key="filter" overlay={menu} trigger={['click']}>
        <Button type={ButtonType.borderless} icon={<FilterIcon />} />
      </Dropdown>
    );
  }, [filter, handleFilterSelect, showCompleted]);

  return (
    <section className="TaskSection">
      <Card title="Action Items" leftToolbarItems={[filterButton]} rightToolbarItems={[addButton]} listCard centerTitle>
        <div className={classNames('CardList', {NoContent: !tasks?.length})}>{listContent}</div>
      </Card>
      <AddTaskModal
        open={showAddTask}
        shouldClose={() => {
          setShowAddTask(false);
          return true;
        }}
      />
    </section>
  );
};

export default TaskList;
