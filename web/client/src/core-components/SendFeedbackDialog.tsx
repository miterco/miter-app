import {Modal, Form, Input, InputRef} from 'antd';
import Button, {ButtonType, ButtonVariant} from '../basic-components/Button';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useMiterContext} from '../model/MiterContextProvider';
import {waitATick} from '../Utils';
import {TextAreaRef} from 'antd/lib/input/TextArea';
import './SendFeedbackDialog.less';
import {sendFeedback} from '../model/MeetingApi';

const formRules: Record<string, Record<string, boolean | string>[]> = {
  email: [
    {required: true, message: 'Please enter your email address.'},
    {type: 'email', message: "This doesn't look like a valid email address."},
  ],
  content: [{required: true, message: "You left your feedback empty...does that mean we're perfect?"}],
};

const SendFeedbackDialog: React.FC<{open: boolean; shouldClose: () => void}> = ({open, shouldClose}) => {
  const {currentUser} = useMiterContext();
  const [form] = Form.useForm();
  const [userEmail, setUserEmail] = useState(currentUser?.email);
  const emailInputRef = useRef<InputRef>(null);
  const contentInputRef = useRef<TextAreaRef>(null);

  const handleSubmit = useCallback(() => {
    const email = form.getFieldValue('email');
    const feedback = form.getFieldValue('feedback');
    setUserEmail(email);
    sendFeedback(email, feedback);
    shouldClose();
    form.resetFields(['feedback']);
  }, [shouldClose, form]);

  const footer = useMemo(
    () => [
      <Button key="cancel" onClick={shouldClose}>
        Cancel
      </Button>,
      <Button key="submit" onClick={form.submit} type={ButtonType.primary}>
        Send Feedback
      </Button>,
    ],
    [shouldClose, form]
  );

  useEffect(
    () =>
      waitATick(() => {
        if (open && emailInputRef.current && contentInputRef.current) {
          (userEmail ? contentInputRef.current : emailInputRef.current).focus();
        }
      }),
    [open, emailInputRef, contentInputRef, userEmail]
  );

  return (
    <Modal
      className="SendFeedbackDialog"
      title="Send Product Feedback"
      open={open}
      footer={footer}
      onOk={form.submit}
      onCancel={shouldClose}
    >
      <Form form={form} name="feedback" layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item label="Your Email" name="email" rules={formRules.email} initialValue={currentUser?.email}>
          <Input type="email" ref={emailInputRef} />
        </Form.Item>
        <Form.Item label="What's your feedback?" name="feedback" rules={formRules.content}>
          <Input.TextArea rows={5} ref={contentInputRef} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendFeedbackDialog;
