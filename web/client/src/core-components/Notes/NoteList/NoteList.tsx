import NoteView from 'core-components/Notes/NoteView';
import './NoteList.less';
import Composer from 'core-components/Composer';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Empty} from 'antd';
import {useMiterContext} from 'model/MiterContextProvider';
import {error, KeyboardShortcuts, waitATick} from 'Utils';
import {createNote, pinNote} from 'model/NoteApi';
import {ItemType, ItemTypeValues, Note} from 'miter-common/SharedTypes';
import {useKeyboardShortcuts} from 'hooks/useKeyboardShortcuts';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useMiterTour} from 'core-components/MiterTourContextProvider';

const PinKeys = ItemTypeValues.map(itemType => KeyboardShortcuts.byCommand[itemType]);

const NoteList: React.FC<{}> = () => {
  const {attendees, notes} = useMiterContext();
  const {protocols, protocolTypes} = useProtocolContext();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [composerItemType, setComposerItemType] = useState<ItemType>('None');
  const contextMenuHider = useRef<(() => void) | null>(null);
  const {openTour} = useMiterTour();

  useEffect(() => {
    if (notes) {
      waitATick(() => setInitialLoadComplete(true));
      openTour();
    }
  }, [notes, openTour]);

  useKeyboardShortcuts(
    PinKeys,
    shortcut => {
      const selectedType = KeyboardShortcuts.byShortcut[shortcut];
      if (focusedNoteId) {
        const focusedNote = notes?.find(note => note.id === focusedNoteId);
        if (!focusedNote) {
          error("Stored a focused note ID but couldn't find the note associated with it.");
          return;
        }
        if (focusedNote.itemType !== selectedType) pinNote(focusedNote, selectedType);
      } else {
        setComposerItemType(selectedType);
      }
    },
    [focusedNoteId, notes]
  );

  const handleCreateNote = useCallback(
    (itemText: string) => {
      createNote({
        itemText,
        targetDate: null,
        itemType: composerItemType,
      });
      setComposerItemType('None');
    },
    [composerItemType]
  );

  const handleContextMenuShow = useCallback(
    (note: Note, hider: () => void) => {
      setFocusedNoteId(note.id);
      contextMenuHider.current = hider;
    },
    [contextMenuHider]
  );

  const handleContextMenuHide = useCallback((note: Note) => {
    setFocusedNoteId(null);
  }, []);

  const handleContextMenuSelect = useCallback(() => {
    setFocusedNoteId(null);
    composerRef.current?.focus();
  }, []);

  const handleComposerKeyPress = useCallback(() => {
    setFocusedNoteId(null);
    if (contextMenuHider.current) contextMenuHider.current();
  }, [contextMenuHider]);

  const content = useMemo(() => {
    if (!protocolTypes || !protocols) return null; // Wait until the protocols have loaded.

    return (
      <div className="NoteList">
        <div className="Inner">
          <Composer
            key="composer"
            placeholder="Add a note"
            onCreateNote={handleCreateNote}
            ref={composerRef}
            itemType={composerItemType}
            onKeyPress={handleComposerKeyPress}
          />

          {notes?.length ? (
            <>
              {
                // Reversing the array after the map keeps keys consistent as new content is added.
                notes
                  .map((note, i) => {
                    // Hide contiguous topic-changes other than the last
                    if (note.systemMessageType === 'CurrentTopicSet') {
                      // Don't render anything if this is a topic-change and the next one is too
                      if (i + 1 < notes.length && notes[i + 1].systemMessageType === 'CurrentTopicSet') {
                        return undefined;
                      }

                      // Don't render anything if this is a topic-change but we're back at the topic of the last note
                      for (let j = i - 1; j >= 0; j--) {
                        if (notes[j].systemMessageType !== 'CurrentTopicSet') {
                          if (notes[j].topicId === notes[i].topicId) return undefined;
                          else break;
                        }
                      }
                    }

                    return (
                      <NoteView
                        note={note}
                        author={note.createdBy ? attendees[note.createdBy] || {} : {}}
                        key={i}
                        animateIn={initialLoadComplete}
                        didSelectFromContextMenu={handleContextMenuSelect}
                        onShowContextMenu={handleContextMenuShow}
                        onHideContextMenu={handleContextMenuHide}
                      />
                    );
                  })
                  .reverse()
              }
            </>
          ) : (
            <Empty
              className="Empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<div>{notes ? 'No notes yet. Start typing below to add one!' : 'Loading...'}</div>}
            />
          )}
        </div>
      </div>
    );
  }, [
    attendees,
    composerItemType,
    handleComposerKeyPress,
    handleContextMenuHide,
    handleContextMenuSelect,
    handleContextMenuShow,
    handleCreateNote,
    initialLoadComplete,
    notes,
    protocols,
    protocolTypes,
  ]);

  return content;
};

export default NoteList;
