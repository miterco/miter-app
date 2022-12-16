import {useCallback, useEffect, useMemo, useState} from 'react';
import Button, {ButtonSize, ButtonType} from '../basic-components/Button';
import {copyPriorTopics, fetchHasPriorTopics} from '../model/TopicApi';
import {ReactComponent as CopyIcon} from '../image/copy.svg';
import {useMiterContext} from '../model/MiterContextProvider';

const useCopyPriorTopicsButton = (isPresent: boolean, hideLabel?: boolean) => {
  const {signInState} = useMiterContext();
  const [didCopyTopics, setDidCopyTopics] = useState(false);
  const [hasPriorTopics, setHasPriorTopics] = useState(false);

  const fetchAndSetHasPriorTopics = useCallback(async () => {
    if (signInState === 'SignedIn') setHasPriorTopics(await fetchHasPriorTopics());
  }, [signInState]);

  useEffect(() => {
    fetchAndSetHasPriorTopics();
  }, [fetchAndSetHasPriorTopics]);

  const handleCopyTopics = useCallback(() => {
    copyPriorTopics();
    setDidCopyTopics(true);
  }, []);

  const button = useMemo(() => {
    if (isPresent) {
      return (
        <Button
          type={ButtonType.borderless}
          key="copyPrev"
          title="Copy all topics from the previous meeting in this series"
          disabled={!hasPriorTopics || didCopyTopics}
          className="CopyPriorBtn"
          onClick={handleCopyTopics}
          size={ButtonSize.small}
          icon={<CopyIcon />}
        >
          {!hideLabel && 'Copy Previous'}
        </Button>
      );
    }

    return <></>;
  }, [didCopyTopics, handleCopyTopics, hasPriorTopics, isPresent, hideLabel]);

  return button;
};

export default useCopyPriorTopicsButton;
