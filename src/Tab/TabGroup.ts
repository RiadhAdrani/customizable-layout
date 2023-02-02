import { createElement, setAttribute } from "../Dom";
import { clamp } from "@riadh-adrani/utility-js";
import Layout from "../Layout/Layout";
import { useId } from "../Utils";

export const TabSymbol = Symbol.for("tab");

export interface TabGroupEvents {
  onBeforeTabToggle?: (tab: Tab, group: TabGroup) => void;
  onTabToggled?: (tab: Tab, group: TabGroup) => void;
  onBeforeTabRemove?: (tab: Tab, group: TabGroup) => void;
  onTabRemoved?: (tab: Tab, group: TabGroup) => void;
  onBeforeTabAdd?: (tab: Tab, group: TabGroup) => void;
  onTabAdded?: (tab: Tab, group: TabGroup) => void;
}

export interface Tab {
  element: () => Element;
  title: string;
  id: string;
  onBeforeMount?: (group: TabGroup) => void;
  onMounted?: (group: TabGroup) => void;
  onBeforeUnmount?: (group: TabGroup) => void;
  onUnmounted?: (group: TabGroup) => void;
}

export default class TabGroup {
  id = useId();
  items: Array<Tab> = [];
  activeId?: string;
  element: Element = null as unknown as Element;
  parent?: Layout;
  events?: TabGroupEvents;

  constructor(items: Array<Tab> = [], events: TabGroupEvents = {}) {
    this.items = items;
    this.events = events;
  }

  get contentElement(): HTMLElement {
    return this.element.querySelector(".tab-group-content")!;
  }

  get currentTab(): Tab {
    return this.items.find((tab) => tab.id === this.activeId)!;
  }

  toggle(id: string) {
    const contentWrapper = this.element.querySelector(".tab-group-content")!;

    if (this.activeId === id) {
      return;
    }

    const currentTab = this.items.find((item) => item.id === this.activeId);
    const newTab = this.items.find((item) => item.id === id);

    if (newTab) {
      this.events?.onBeforeTabToggle?.(newTab, this);
      newTab.onBeforeMount?.(this);
      currentTab?.onBeforeUnmount?.(this);

      this.activeId = id;

      if (contentWrapper.hasChildNodes()) {
        contentWrapper.childNodes.item(0).replaceWith(newTab.element());
      } else {
        contentWrapper.appendChild(newTab.element());
      }

      const currentActiveTabButton = this.element.querySelector(
        '.tab-group-btn[data-active="true"]'
      );
      if (currentActiveTabButton) {
        setAttribute("data-active", false, currentActiveTabButton);
      }

      const newActiveTabButton = this.element.querySelector(`#tab-group-btn-${id}`)!;
      setAttribute("data-active", true, newActiveTabButton);

      this.events?.onTabToggled?.(newTab, this);
      newTab.onMounted?.(this);
      currentTab?.onUnmounted?.(this);
    }
  }

  remove(id: string): number {
    if (!this.doExist(id)) {
      return this.items.length;
    }

    const tab = this.items.find((item) => item.id === id)!;

    const newItems = this.items.filter((item) => item.id !== id);

    if (newItems.length === 0) {
      this.onEmptied();
    } else if (this.activeId === id) {
      this.toggle(newItems[0].id);
    }

    this.items = newItems;

    // TODO : execute tab hooks + tests

    this.events?.onBeforeTabRemove?.(tab, this);
    this.element.querySelector(`#tab-group-btn-${id}`)?.remove();
    this.events?.onTabRemoved?.(tab, this);

    return this.items.length;
  }

  add(item: Tab, position: number = Infinity): number {
    if (this.doExist(item.id)) {
      throw `Tab with id (${item.id}) already exists !`;
    }

    this.events?.onBeforeTabAdd?.(item, this);

    const pos = clamp(0, position, this.items.length);

    this.items = [...this.items.slice(0, pos), item, ...this.items.slice(pos + 1)];

    const tabs = this.element.querySelector(".tab-group-tabs")!;

    tabs.append(this.createTabButton(item, false));

    this.toggle(item.id);

    this.events?.onTabAdded?.(item, this);

    return this.items.length;
  }

  onEmptied() {
    this.parent?.onTabGroupEmptied();
  }

  doExist(id: string): boolean {
    return this.items.some((tab) => tab.id === id);
  }

  isActive(id: string): boolean {
    return id === this.activeId;
  }

  getTabButtonById(id: string): HTMLElement {
    return this.element.querySelector(`#tab-group-btn-${id}`)!;
  }

  createTabButton(item: Tab, active: boolean): Element {
    return createElement("button", {
      children: [item.title],
      attributes: {
        class: "tab-group-btn",
        id: `tab-group-btn-${item.id}`,
        draggable: "true",
        "data-active": active,
      },
      events: {
        onclick: () => this.toggle(item.id),
        oncontextmenu: (e) => {
          e.preventDefault();
          this.remove(item.id);
        },
        ondragstart: (e) => {
          const ev = e;
          e.stopPropagation();

          const data = {
            id: item.id,
            __symbol__: TabSymbol.description,
          };

          (ev as unknown as DragEvent).dataTransfer?.setData("text/plain", JSON.stringify(data));
        },
      },
    });
  }

  render(): Element {
    if (!this.activeId && this.items.length > 0) {
      this.activeId = this.items[0].id;
    }

    const content: Array<Element> = this.items
      .filter((item) => this.isActive(item.id))
      .map((item) => item.element());

    const el = createElement("div", {
      attributes: {
        class: "tab-group",
      },
      children: [
        createElement("nav", {
          attributes: { class: "tab-group-tabs" },
          children: this.items.map((item) => this.createTabButton(item, this.isActive(item.id))),
        }),
        createElement("div", { attributes: { class: "tab-group-content" }, children: content }),
      ],
    });

    this.element = el;

    return this.element;
  }
}
