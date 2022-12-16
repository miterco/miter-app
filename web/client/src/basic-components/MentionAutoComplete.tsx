/**
 * MentionAutoComplete
 *
 * Adds a mention autocomplete dialog on top of the element it wraps. This component abstracts
 * the process of fetching the relevant people for the meeting and search of autocomplete results.
 */

import React, {useMemo} from 'react';
import {AutoComplete} from 'antd';

import Avatar from './Avatar';
import {useMiterContext} from '../model/MiterContextProvider';
import {getUserPreference} from '../model/UserPrefs';
import {EmailRecipient} from 'miter-common/SharedTypes';
import './MentionAutoComplete.less';

interface Props {
  open: boolean;
  onSelect(value: string, option: Object): any;
  onStateChange?(isVisible: boolean): void;
  searchQuery?: string | null;
  className?: string;
}

const MentionAutoComplete: React.FC<Props> = ({
  open, // Whether the autocomplete dialog should be open or not.
  onSelect, // Function that will be called when the user selects someone from the list.
  searchQuery, // The search query to filter the suggestions with.
  onStateChange, // Function called when the dropdown changes state.
  children, // The nested contents of the component.
  className,
}) => {
  const {relevantPeople} = useMiterContext();
  const atMentionOptions = useMemo(() => {
    const options = [];
    const pastEmailRecipients = Object.values(getUserPreference('EmailRecipients')) as EmailRecipient[];
    const people: EmailRecipient[] = [...relevantPeople, ...pastEmailRecipients];
    const alreadyAdded: Record<string, boolean> = {};

    for (const person of people) {
      if (!person?.email || alreadyAdded[person.email]) continue; // Only include identifiable users.
      const currentOption = {
        label: (
          <div>
            <Avatar user={person} /> {person.name || person.email}
          </div>
        ),
        value: person.email || '',
        person,
      };

      if (!searchQuery) {
        // If no search query is provided, just add everyone to the list.
        options.push(currentOption);
        alreadyAdded[person.email] = true;
        continue;
      }

      const names = (person?.name?.toLowerCase() || '').split(' ');

      if ([...names, person?.email || ''].some(word => word.startsWith(searchQuery.toLowerCase()))) {
        options.push(currentOption);
        alreadyAdded[person.email] = true;
      }
    }

    if (searchQuery) {
      options.push({
        label: (
          <div>
            <Avatar /> {searchQuery}
          </div>
        ),
        value: searchQuery,
        person: null,
      });
    }

    return options;
  }, [relevantPeople, searchQuery]);

  return (
    <AutoComplete
      open={open}
      className={className}
      options={atMentionOptions}
      dropdownClassName="MentionAutoComplete__dropdown"
      dropdownMatchSelectWidth={false}
      onDropdownVisibleChange={onStateChange}
      value=""
      onSelect={onSelect}
    >
      {children}
    </AutoComplete>
  );
};

export default MentionAutoComplete;
