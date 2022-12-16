import {Empty, Input, Spin} from 'antd';
import Form from 'antd/lib/form';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ReactComponent as LogoLockup} from '../image/logo-lockup.svg';
import {ReactComponent as ErrorIcon} from '../image/error.svg';
import {createMeeting} from '../model/MeetingApi';
import Card from './Card';
import './MeetingNav.less';
import classNames from 'classnames';
import Button, {ButtonSize, ButtonType, ButtonVariant} from '../basic-components/Button';
import {useZoomContext, ZoomAppContext} from '../model/ZoomContextProvider';
import {useMeetingListContext} from '../model/MeetingListContextProvider';
import {log} from '../Utils';
import MeetingList from './MeetingList';
import {useMiterContext} from 'model/MiterContextProvider';

const MeetingNav: React.FC = () => {
  const {isZoomApp, zoomContext} = useZoomContext();
  const {meetingExternalIdentifier} = useParams<{meetingExternalIdentifier: string}>();
  const {meetingList, loadMeetingList, reloadMeetingList, isLoading} = useMeetingListContext();
  const {setShowSignInDialog, signInState} = useMiterContext();
  const didLoadMeetingList = useRef(false);
  const [instantMeetingTitle, setInstantMeetingTitle] = useState('');
  const navigate = useNavigate();
  const nextMeetingRef = useRef<HTMLDivElement>(null);
  const meetingListRef = useRef<HTMLDivElement>(null);
  const stickyStack = useRef<Element[]>([]);
  const [createForm] = Form.useForm();

  useEffect(() => {
    loadMeetingList('mount');
  }, [loadMeetingList]);

  useEffect(() => {
    if (!didLoadMeetingList.current && meetingList && nextMeetingRef.current && meetingListRef.current) {
      // Rough approximation of centering the scroll position on now. Will refine later.
      const nextMeetingCenterY = nextMeetingRef.current.offsetTop + nextMeetingRef.current.offsetHeight / 2;
      const listHeight = meetingListRef.current.offsetHeight;
      meetingListRef.current.scrollTop = nextMeetingCenterY - listHeight / 2;
      didLoadMeetingList.current = true;
    }
  }, [meetingList]);

  const handleInputChange = (value: string) => {
    setInstantMeetingTitle(value.trim());
  };

  const handleCreateInstant = useCallback(async () => {
    if (zoomContext === ZoomAppContext.InMainClient) {
      return window.zoomSdk.callZoomApi('launchAppInMeeting', {});
    }

    const title = instantMeetingTitle;
    setInstantMeetingTitle('');
    createForm.resetFields();
    const createdMeetingToken = await createMeeting(title);
    if (createdMeetingToken) {
      navigate(`/m/${createdMeetingToken}`);
      reloadMeetingList('create');
    }
  }, [instantMeetingTitle, navigate, reloadMeetingList, createForm, zoomContext]);

  const handleSelectMeeting = useCallback(
    (token: string) => {
      navigate(`/m/${token}`);
    },
    [navigate]
  );

  const handleHeaderStick = useCallback((el: Element) => {
    if (stickyStack.current.length) stickyStack.current[0].classList.add('Hidden');
    el.classList.add('Stuck');
    stickyStack.current.push(el);
  }, []);

  const handleHeaderUnstick = useCallback((el: Element) => {
    if (stickyStack.current.pop() !== el) log("Top of sticky stack doesn't match unstuck header.");
    el.classList.remove('Stuck');
    if (stickyStack.current.length) stickyStack.current[0].classList.remove('Hidden');
  }, []);

  const meetingListContent = useMemo(() => {
    if (isLoading) return <Spin delay={150} size="large" tip="Loading your meetings..." />;

    switch (signInState) {
      case 'SignedIn':
        return (
          <MeetingList
            meetings={meetingList}
            groupByDate
            selectedId={meetingExternalIdentifier}
            emptyMessage={
              isZoomApp
                ? 'No Miter meetings yet. To get started, click Start Meeting in the top right of this window.'
                : 'No meetings yesterday, none in the next day. Congrats!'
            }
            onSelect={handleSelectMeeting}
            onStickHeader={handleHeaderStick}
            onUnstickHeader={handleHeaderUnstick}
          />
        );

      case 'SignedOut':
        // Theoretically we should never hit a SignedOut state in Zoom.
        return (
          <div className="SignInCard">
            <p>
              Connect Miter to Google Calendar to see your past and future meetings here (including this one!) for easy
              access to prep, notes, and summaries.
            </p>
            <Button type={ButtonType.primary} variant={ButtonVariant.outline} onClick={() => setShowSignInDialog(true)}>
              Connect GCal
            </Button>
          </div>
        );

      default:
        return (
          <Empty
            className="Empty Error"
            image={<ErrorIcon />}
            description="There was an error loading your meetings."
          />
        );
    }
  }, [
    signInState,
    isLoading,
    meetingList,
    meetingExternalIdentifier,
    isZoomApp,
    handleSelectMeeting,
    handleHeaderStick,
    handleHeaderUnstick,
    setShowSignInDialog,
  ]);

  return (
    <section className="MeetingNav">
      {/* TODO this logo solution is hacky */}
      <LogoLockup className="TopLogo" />
      <Card className="InstantMeeting" title="Instant Meeting" centerTitle>
        <div>
          <Form name="create" layout="inline" onFinish={handleCreateInstant} form={createForm}>
            <label htmlFor="title">Meeting Title</label>

            <Form.Item name="title" label="Meeting Title" noStyle>
              {zoomContext === ZoomAppContext.NotInZoom && (
                <Input
                  autoComplete="off"
                  onChange={e => handleInputChange(e.target.value)}
                  name="title"
                  placeholder="What's this meeting about?"
                  autoFocus
                  size="large"
                />
              )}
            </Form.Item>

            <Form.Item noStyle>
              {zoomContext !== ZoomAppContext.Pending && (
                <Button
                  disabled={zoomContext === ZoomAppContext.NotInZoom && instantMeetingTitle.length === 0}
                  type={ButtonType.primary}
                  htmlType="submit"
                  size={ButtonSize.large}
                >
                  {zoomContext === ZoomAppContext.NotInZoom ? 'Create' : 'Meet Now'}
                </Button>
              )}
            </Form.Item>
          </Form>
        </div>
      </Card>
      <Card
        title="My Meetings"
        listCard
        centerTitle
        leftToolbarItems={isLoading ? [<Spin key="spin" size="small" />] : undefined}
      >
        <div ref={meetingListRef} className={classNames('CardList', {NoContent: isLoading || !meetingList?.length})}>
          {meetingListContent}
        </div>
      </Card>
    </section>
  );
};

export default MeetingNav;
