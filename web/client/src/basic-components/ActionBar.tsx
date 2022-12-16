/*
 * Responsive toolbar / action bar in the style of Android ActionBar, with
 * some iOS influence thrown in. The responsiveness is somewhat heuristic-
 * based (rather than measuring text, which we may end up doing eventually).
 */

import './ActionBar.less';
import {ReactElement, ReactNode, useCallback, useMemo} from 'react';
import classNames from 'classnames';
import Button, {ButtonType} from './Button';
import {Dropdown, Menu} from 'antd';
import {ReactComponent as OverflowIcon} from '../image/overflow.svg';
import useWidthObserver from '../hooks/useWidthObserver';

/*
 * Action-bar items can produce dropdown menus. This type defines an item in one of those.
 */
export interface BarMenuItem {
  key?: string;
  content: ReactElement;
}

/*
 * Specifies an item in an action bar. Actual rendering is taken care of internally.
 */
export interface BarItem {
  icon: ReactNode;
  label: string;
  description?: string; // Rendered as a tooltip when the item is a button.
  preferCollapseToOverflow?: boolean; // When we run out of room, allow this item to collapse to just an icon
  onClick?: (key?: string) => void; // When menuItems is present, the key will be that of the clicked item.
  menuItems?: BarMenuItem[]; // Causes ActionBar to render this item with a dropdown menu.
  addMenuDividers?: boolean; // Render horizontal divider lines between menu items.
  disabled?: boolean;
  visible: boolean;
}

/*
 * Dimensions used in calculating what's shown, collapsed, and moved to overflow. Rather than
 * explicitly calculate text width, we use ApproxCharWidth to get a rough approximation, which
 * may be good enough. The other constants encapsulate button dimensions (and will be invalid
 * if we modify the associated CSS files).
 */
const ApproxCharWidth = 7.85;
const IconWidth = 42; /* 24w + 8 padding + 1 border */
const CollapsedButtonWidth = IconWidth; /* no padding on icon-only buttons */
const ButtonBaseWidth = IconWidth + 17; /* 4/11 padding + 1 border */

/*
 * Calculate the full width of a visible action-bar item with its label.
 */
const calcDefaultWidth = (item: BarItem) => ApproxCharWidth * item.label.length + ButtonBaseWidth;

interface ActionBarProps {
  items: BarItem[][]; // Array of groups of items, typed as BarItem.
  rightAlignLastGroup?: boolean; // If true, we right-align the last group
}

/*
 * Turn a BarItem into a visible toolbar item, collapsing if requested. The collapse parameter
 * supersedes the BarItem's own preference, which we assume has already been factored in.
 */
const makeVisibleItemNode = (item: BarItem, index: number, collapse: boolean) => {
  const {onClick} = item;
  const button = (
    <Button
      key={index}
      className="BarItem"
      type={ButtonType.borderless}
      title={item.description}
      icon={item.icon}
      onClick={!item.menuItems && onClick ? () => onClick() : undefined}
      disabled={item.disabled}
    >
      {!collapse && item.label}
    </Button>
  );

  if (!item.menuItems) return button;

  const {menuItems} = item;
  const menuItemNodes: ReactElement[] = [];
  item.menuItems.forEach((menuItem, i) => {
    menuItemNodes.push(<Menu.Item key={menuItem.key || i}>{menuItem.content}</Menu.Item>);
    if (item.addMenuDividers && i < menuItems.length - 1) {
      menuItemNodes.push(<Menu.Divider key={`${i}_div`} className="ItemDivider" />);
    }
  });
  const menu = <Menu onClick={onClick ? info => onClick(info.key) : undefined}>{menuItemNodes}</Menu>;
  return (
    <Dropdown key={index} overlay={menu} trigger={['click']} disabled={item.disabled}>
      {button}
    </Dropdown>
  );
};

/*
 * Turn a BarItem into a menu item for the overflow menu.
 */
const makeOverflowItemNode = (item: BarItem, index: number) => (
  <Menu.Item icon={item.icon} key={index}>
    {item.label}
  </Menu.Item>
);

const ActionBar: React.FC<ActionBarProps> = ({items, rightAlignLastGroup}) => {
  const {width, setRef} = useWidthObserver();

  /*
   * Basic sizing / display info about the items passed in. These metrics are
   * dependent on content only, and don't change based on ActionBar size.
   */
  const metrics = useMemo(() => {
    let totalDefaultWidth = 0;
    let totalCollapsedWidth = 0;
    const collapsibleItems: BarItem[] = [];
    items.forEach(group => {
      group.forEach(item => {
        if (!item.visible) return; // Skip it if the item is not visible.
        totalDefaultWidth += calcDefaultWidth(item);
        totalCollapsedWidth += item.preferCollapseToOverflow ? CollapsedButtonWidth : calcDefaultWidth(item);
        if (item.preferCollapseToOverflow) collapsibleItems.push(item);
      });
    });
    return {totalDefaultWidth, totalCollapsedWidth, collapsibleItems};
  }, [items]);

  /*
   * Based on current size and metrics, determine what's visible, what goes in the overflow, and
   * how many visible items should be collapsed to icons.
   */
  const sortedItemInfo = useMemo(() => {
    const {totalDefaultWidth, totalCollapsedWidth, collapsibleItems} = metrics;

    if (totalCollapsedWidth < width) {
      // With or without collapsing some items that permit it, we can leave all items visible
      // and don't need an overflow menu.

      let collapsedCount = 0;
      if (totalDefaultWidth > width) {
        // We know we can fit everything with all collapsible items collapsed, and now we know
        // we _can't_ fit everything with everything expanded, so we have to collapse one or
        // more items. Now, weigure out how many items we need to collapse. Iterate over collapsible
        // items last-to-first, subtracting the difference between their expanded and collapsed width
        // from the total content width until the total content width is less than the available width.
        // Once we cross that threshold, we don't need to collapse any more items.

        let currentContentWidth = totalDefaultWidth;
        for (let i = collapsibleItems.length - 1; i >= 0; i--) {
          collapsedCount++;
          currentContentWidth = currentContentWidth - calcDefaultWidth(collapsibleItems[i]) + CollapsedButtonWidth;
          if (currentContentWidth < width) break;
        }
      }

      return {
        visibleItems: items.map(group => group.filter(item => item.visible)), // Skip items that aren't visible.
        overflowItems: [],
        collapsedCount,
      };
    }

    // If we're here, collapsing everything won't be enough. So that means we will collapse everything
    // that's collapsible, and then we'll have to put some items in the overflow menu.

    const visibleItems: BarItem[][] = [];
    const overflowItems: BarItem[] = [];

    // Iterate over the items, last to first.

    // To determine which items go in overflow, we start with the total collapsed width (since we're
    // going to collapse everything collapsible) and add the width of another collapsed button so there's
    // space for the overflow menu itself.
    let currentContentWidth = totalCollapsedWidth + CollapsedButtonWidth;

    // Iterate over all the items, last to first, to figure out visible vs. overflow. We go last to first
    // because we'd rather move stuff off the end into overflow than off the beginning.
    for (let i = items.length - 1; i >= 0; i--) {
      // items[i] is a group of items. If our content width is already < our available width, we can just
      // move the group into visible.
      if (currentContentWidth < width) visibleItems.push(items[i]);
      else {
        // Some or all of this group will need to go in the overflow.

        const visibleGroup: BarItem[] = []; // Whichever items will actually be visible.

        for (let j = items[i].length - 1; j >= 0; j--) {
          const currentItem = items[i][j];

          if (!currentItem.visible) continue; // Skip it if the item is not visible.
          if (currentContentWidth > width) {
            // Still too wide. Stick this item in the overflow menu, then subtract its width from the total.
            overflowItems.push(items[i][j]);
            currentContentWidth -= currentItem.preferCollapseToOverflow
              ? CollapsedButtonWidth
              : calcDefaultWidth(currentItem);
          } else {
            // We're done adding to overflow; just put this item in our visible group.
            visibleGroup.push(currentItem);
          }
        }
        if (visibleGroup.length) {
          visibleGroup.reverse(); // ...since our reverse loop added items in reverse order.
          visibleItems.push(visibleGroup);
        }
      }
    }
    visibleItems.reverse();
    overflowItems.reverse();

    return {visibleItems, overflowItems, collapsedCount: collapsibleItems.length};
  }, [items, metrics, width]);

  /*
   * We know which items will be visible, in the overflow, and how many we need to collapse.
   * Now, render the nodes for them.
   */
  const {visibleNodes, overflowNodes, overflowHandlers} = useMemo(() => {
    const {visibleItems, overflowItems, collapsedCount} = sortedItemInfo;

    let expandedCollapsibles = 0; // Since we're collapsing right to left, we track number of expanded collapsibles as we go left to right.
    let nextItemIndex = 0; // Used to create unique keys for the elements.
    const visibleNodes = visibleItems.map((group, i) => {
      return (
        <div
          key={i}
          className={classNames('Group', {
            R: rightAlignLastGroup && visibleItems.length > 1 && i === visibleItems.length - 1,
          })}
        >
          {group.map(item => {
            nextItemIndex++;
            const shouldCollapse =
              expandedCollapsibles > metrics.collapsibleItems.length - collapsedCount &&
              item.preferCollapseToOverflow === true;
            if (!shouldCollapse) expandedCollapsibles++;
            return makeVisibleItemNode(item, nextItemIndex - 1, shouldCollapse);
          })}
        </div>
      );
    });

    // Render the overflow items and store their handlers, using the array index as key to
    // associate the two.
    const overflowHandlers: Record<string, (() => void) | undefined> = {};
    const overflowNodes = overflowItems.map((item, i) => {
      overflowHandlers[i] = item.onClick;
      return makeOverflowItemNode(item, i);
    });

    return {visibleNodes, overflowNodes, overflowHandlers};
  }, [rightAlignLastGroup, sortedItemInfo, metrics.collapsibleItems]);

  // Handle selection from the overflow menu. The key we get should correspond to the relevant
  // handler in the handlers map.
  const handleOverflowClick = useCallback(
    (info: any) => {
      const handler = overflowHandlers[info.key];
      if (handler) handler();
    },
    [overflowHandlers]
  );

  const overflowMenu = useMemo(() => {
    if (overflowNodes.length === 0) return null;
    return <Menu onClick={handleOverflowClick}>{overflowNodes}</Menu>;
  }, [handleOverflowClick, overflowNodes]);

  return (
    <div className="ActionBar" ref={setRef}>
      {visibleNodes}
      {overflowMenu && (
        <div className={classNames('Group', 'OverflowGroup', {R: !rightAlignLastGroup || visibleNodes.length < 2})}>
          <Dropdown overlay={overflowMenu} trigger={['click']}>
            <Button type={ButtonType.borderless} className="BarItem" icon={<OverflowIcon />} />
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default ActionBar;
