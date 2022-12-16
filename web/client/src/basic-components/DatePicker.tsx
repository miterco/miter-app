/*
 * Wrapper around Ant's DatePicker. Using it directly there doesn't seem to be a way
 * to have the right mix of controlled and uncontrolled. Specifically, you either
 * use defaultValue and then can't update value later; or, you use value and then
 * changes in the popup picker don't update the input.
 *
 * TODO: Long term, I don't love this picker because it's finicky about typed input,
 * but I didn't see an obvious alternative. What we really want, I think, is an
 * out-of-the-box picker popup we can combine with our own input logic.
 */
import { DatePicker as AntDatePicker } from "antd";
import moment from "moment"; // Used by / dependency of ant
import { KeyboardEvent, useEffect, useState } from "react";

// TODO Ant's parsing of typed dates isn't great. May want to look for another picker
const openDateFormats = ["M/D/Y", "M/D", "MMM D", "MMM D Y"];
const closedDateFormats = ["ddd, MMM D"];

interface DatePickerProps {
  value?: Date | null;
  placeholder?: string;
  onChange?: (dateValue: Date | null) => void;
  onCancel?: () => void;
}

const DatePicker = (props: DatePickerProps) => {
  // const [internalValue, setInternalValue] =
  const [isOpen, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(props.value || null);

  useEffect(() => {
    // Set internal value whenever value is updated externally
    setInternalValue(props.value || null);
  }, [props.value]);

  const handleChange = (momentValue: moment.Moment | null) => {
    const updatedVal = momentValue ? momentValue.toDate() : null;
    if (props.onChange) props.onChange(updatedVal);
    setInternalValue(updatedVal);
  };

  const handleOpenChange = (openState: boolean) => {
    setOpen(openState);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !isOpen) {
      if (props.onCancel) props.onCancel();
    }
  };

  return (
    <AntDatePicker
      className="DateInput"
      bordered={false}
      mode="date"
      placeholder={props.placeholder || "Select date"}
      format={isOpen ? openDateFormats : closedDateFormats}
      onChange={handleChange}
      onOpenChange={handleOpenChange}
      onKeyDown={handleKeyDown}
      value={internalValue ? moment(internalValue).utc() : undefined}
    />
  );
};

export default DatePicker;
