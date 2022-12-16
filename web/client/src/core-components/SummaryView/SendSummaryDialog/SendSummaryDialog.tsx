// Vendor
import {Modal, Select, Spin, Tag} from 'antd';
import {LabeledValue, RefSelectProps} from 'antd/lib/select';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

// Utils
import {validateEmail} from 'miter-common/CommonUtil';
import {error, showToast, waitATick} from 'Utils';

// Components
import Button, {ButtonType, ButtonVariant} from 'basic-components/Button';

// Types
import {sendSummaryEmail} from 'model/SummaryApi';
import {getUserPreference, setUserPreference} from 'model/UserPrefs';
import {EmailRecipient} from 'miter-common/SharedTypes';

// Providers
import {useMiterContext} from 'model/MiterContextProvider';

// Styles
import './SendSummaryDialog.less';

interface SendSummaryDialogProps {
  open: boolean;
  shouldClose: () => void;
}

type RecipientMap = Record<string, EmailRecipient>;

//
// Ant's Select component is pretty good but not perfect. Took a while to figure some stuff out, so here it is
// for later reference.
//
// - The difference between "multiple" and "tags" mode seems to be that the latter permits entries that
//   aren't in the list of options.
//
// - The value can be an array of strings, or an array of LabeledValues ({label?, value, key?}). This is switched
//   via the labelInValue prop. However, with that set to false (so an array of strings) the type-checking on the
//   value prop is screwy and you have to cast your value to any or something.
//
// - I don't really like the default behavior for when the dropdown appears and disappears because it obscures our
//   dialog buttons. It was not difficult to override this via a bunch of event handlers and controlling the `open` prop.
//
// - In tags mode, Select is _really_ excited about showing all the existing (selected) values in the dropdown with
//   checkmarks. I was unable to eliminate that behavior entirely--it still happens if you start typing and then remove
//   your whole search string--but reduced it to a reasonable level via two filter operations. First, I remove the
//   selected options via the `inputValue` constant that's used to populate the autocomplete. Then, I remove them
//   _again_ in the `filterOptions()` function that determines what matches the search string, because apparently Ant
//   re-adds them.
//
// - LabeledValues only permit numbers and strings as values. We need to keep track of more than that. So, I'm using
//   three variables here. `selected` is a simple list of all the selected email addresses in the input. Think of it
//   as the keys to everything else. Pun intended. `inputValue` is the Ant-friendly version that actually determines
//   what's in the input using LabeledValues. Then there's `recipientPool`, a hash table containing all the potential
//   recipients we know about. (It doesn't contain bare emails because it doesn't need to.) The keys are email addresses,
//   so it's easy to align the two when we need to.
//
// - LabeledValue values can be strings or numbers, so naturally TS complains when we assume they're strings, even though
//   in our case they always are. There are a bunch of toString() calls in there just to keep everybody happy.
//

const SendSummaryDialog: React.FC<SendSummaryDialogProps> = ({open, shouldClose}) => {
  const selectRef = useRef<RefSelectProps>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [recipientPool, setRecipientPool] = useState<RecipientMap>({});
  const {relevantPeople} = useMiterContext();

  const setupRecipients = useCallback(async () => {
    const possibleRecipients = relevantPeople.filter(person => person.email);
    try {
      const pool: RecipientMap = getUserPreference('EmailRecipients');
      possibleRecipients.forEach(recipient => {
        pool[recipient.email] = recipient;
      });
      setSelected(possibleRecipients.map(recipient => recipient.email));
      setRecipientPool(pool);
    } catch (err) {
      error(err);
    }
    setIsLoading(false);
    // Originally we got possible recips by explicit request/response. Now it's in the context, and I'm not
    // sure what potential impact there is if/when possible recips gets updated from the server while the
    // dialog is open. So, I'm omitting relevantPeople as a dependency to play it safe.
    // eslint-disable-next-line
  }, []);

  // Initial setup and focus
  useEffect(() => {
    if (open) {
      setupRecipients();
      waitATick(() => {
        selectRef.current && selectRef.current.focus();
      });
    }
  }, [open, setupRecipients, isLoading]);

  const handleClose = useCallback(() => {
    setSelected([]);
    setRecipientPool({});
    shouldClose();
  }, [shouldClose]);

  const handleOk = useCallback(async () => {
    // *Should* only be called when selected contains valid emails
    const recipients = selected.map(email => recipientPool[email] || {email});
    const nextPool = {...recipientPool};
    selected.forEach(email => {
      if (!nextPool[email]) nextPool[email] = {email};
    });

    handleClose();

    try {
      await sendSummaryEmail(recipients);
      setUserPreference('EmailRecipients', nextPool);
      showToast('Summary email sent.');
    } catch (err: any) {
      showToast(err.toString(), 'Error Sending Email');
      error(err);
    }
  }, [handleClose, selected, recipientPool]);

  const handleSelectChange = useCallback((newValues: LabeledValue[]) => {
    setSelected(newValues.map(labeledValue => labeledValue.value.toString()));
  }, []);

  const areSelectedValid = useMemo(() => {
    let result = true;
    selected.forEach(email => {
      if (!validateEmail(email)) result = false;
    });
    return result;
  }, [selected]);

  const renderTag = useCallback((tagProps: any) => {
    return (
      <Tag
        className={validateEmail(tagProps.value) ? 'Valid' : 'Invalid'}
        closable={tagProps.closable}
        onClose={tagProps.onClose}
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {tagProps.label}
      </Tag>
    );
  }, []);

  const modalFooter = useMemo(() => {
    return [
      <div key="error" className="Error">
        {areSelectedValid ? '' : 'One or more emails are invalid.'}
      </div>,
      <Button key="cancel" onClick={handleClose} tabIndex={3}>
        Cancel
      </Button>,
      <Button
        key="submit"
        onClick={handleOk}
        type={ButtonType.primary}
        disabled={!selected.length || !areSelectedValid}
        tabIndex={2}
      >
        Send
      </Button>,
    ];
  }, [handleOk, handleClose, areSelectedValid, selected.length]);

  const dropdownOptions = useMemo(() => {
    const unselectedInPool = Object.values(recipientPool).filter(
      recipient => selected.findIndex(email => email === recipient.email) === -1
    );
    return unselectedInPool.map((recipient, i) => ({
      label:
        recipient.name && recipient.name !== recipient.email
          ? `${recipient.name} (${recipient.email})`
          : recipient.email,
      value: recipient.email,
    }));
  }, [selected, recipientPool]);

  const inputValue = useMemo(() => {
    const result = selected.map(email => ({
      label: recipientPool[email] ? recipientPool[email].name || email : email,
      value: email,
    }));
    return result;
  }, [recipientPool, selected]);

  const filterOptions = useCallback(
    (inputValue: string, option: LabeledValue) => {
      if (selected.findIndex(selectedEmail => selectedEmail === option.value) !== -1) return false;
      return option.value.toString().indexOf(inputValue) !== -1 || option.label?.toString().indexOf(inputValue) !== -1;
    },
    [selected]
  );

  return (
    <Modal
      className="SendSummaryDialog"
      title="Email Summary To:"
      open={open}
      onOk={handleOk}
      onCancel={() => shouldClose()}
      okText="Send"
      footer={modalFooter}
    >
      {isLoading ? (
        <Spin delay={150} size="large" tip="Loading..." />
      ) : (
        <Select
          className="Select"
          dropdownClassName="SendSummaryDropdown"
          ref={selectRef}
          mode="tags"
          placeholder="Type email addresses, separated by commas"
          tokenSeparators={[',', ';']}
          tagRender={renderTag}
          labelInValue
          onChange={handleSelectChange}
          value={inputValue}
          open={dropdownVisible}
          options={dropdownOptions}
          tabIndex={1}
          filterOption={
            // Nested function is because I can't find a way to import the OptionData type for the second parameter here
            (inputValue, optionData) => (optionData ? filterOptions(inputValue, optionData) : false)
          }
          allowClear
          onSearch={() => setDropdownVisible(true)}
          onBlur={() => setDropdownVisible(false)}
          onDeselect={() => setDropdownVisible(false)}
          onSelect={() => {
            setDropdownVisible(false);
          }}
        />
      )}
    </Modal>
  );
};

export default SendSummaryDialog;
