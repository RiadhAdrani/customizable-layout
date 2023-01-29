import { createElement, setAttribute } from "@riadh-adrani/dom-control-js";
import { clamp } from "@riadh-adrani/utility-js";
import Layout from "./Layout";
import { useId } from "./Utils";

export const tabSymbol = Symbol.for("tab");

export interface TabEvents {
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
}

export default class TabGroup {
  id = useId();
  items: Array<Tab> = [];
  activeId?: string;
  element: Element = null as unknown as Element;
  parent?: Layout;
  events?: TabEvents;

  constructor(items: Array<Tab> = [], events: TabEvents = {}) {
    this.items = items;
    this.events = events;
  }

  toggleTab(id: string) {
    const contentWrapper = this.element.querySelector(".tab-group-content")!;

    if (this.activeId === id) {
      return;
    }

    const newTab = this.items.find((item) => item.id === id);

    if (newTab) {
      this.events?.onBeforeTabToggle?.(newTab, this);

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
    }
  }

  removeTab(id: string): number {
    if (!this.doExist(id)) {
      return this.items.length;
    }

    const tab = this.items.find((item) => item.id === id)!;

    this.events?.onBeforeTabRemove?.(tab, this);

    this.items = this.items.filter((item) => item.id !== id);

    if (this.items.length === 0) {
      this.onEmptied();
    } else {
      this.toggleTab(this.items[0].id);
    }

    this.element.querySelector(`#tab-group-btn-${id}`)!.remove();

    this.events?.onTabRemoved?.(tab, this);

    return this.items.length;
  }

  addTab(item: Tab, position: number = Infinity): number {
    if (this.doExist(item.id)) {
      throw `Tab with id (${item.id}) already exists !`;
    }

    this.events?.onBeforeTabAdd?.(item, this);

    const pos = clamp(0, position, this.items.length);

    this.items = [...this.items.slice(0, pos), item, ...this.items.slice(pos + 1)];

    const tabs = this.element.querySelector(".tab-group-tabs")!;

    const addBtn = this.element.querySelector(".add-tab-btn")!;

    tabs.insertBefore(this.createTabButton(item, false), addBtn);

    this.toggleTab(item.id);

    this.events?.onTabAdded?.(item, this);

    return this.items.length;
  }

  emptyContent() {
    this.element.querySelector(".tab-group-content")!.innerHTML = "";
  }

  onEmptied() {
    // this.parent?.onTabGroupEmptied();
  }

  doExist(id: string): boolean {
    return this.items.some((tab) => tab.id === id);
  }

  isActive(id: string): boolean {
    return id === this.activeId;
  }

  createTabButton(item: Tab, active: boolean): Element {
    return createElement("button", {
      children: [item.title],
      attributes: {
        class: "tab-group-btn",
        id: `tab-group-btn-${item.id}`,
        "data-active": active,
        draggable: "true",
      },
      events: {
        onclick: () => this.toggleTab(item.id),
        oncontextmenu: (e) => {
          e.preventDefault();
          this.removeTab(item.id);
        },
        ondragstart: (e) => {
          const ev = e as DragEvent;
          e.stopPropagation();

          const data = {
            id: item.id,
            __symbol__: tabSymbol.description,
          };

          ev.dataTransfer?.setData("text/plain", JSON.stringify(data));
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
      .map((item) => {
        const child = item.element();

        setAttribute("id", item.id, child);

        return child;
      });

    const el = createElement("div", {
      attributes: {
        class: "tab-group",
      },
      children: [
        createElement("nav", {
          attributes: { class: "tab-group-tabs" },
          children: [
            ...this.items.map((item) => this.createTabButton(item, this.isActive(item.id))),
            createElement("button", {
              children: "+",
              attributes: {
                class: "add-tab-btn",
              },
              events: {
                onclick: () => {
                  const tab: Tab = {
                    element: () => createElement("div", { children: useId() }),
                    id: useId(),
                    title: "Random Tab",
                  };

                  this.addTab(tab);
                },
              },
            }),
          ],
        }),
        createElement("div", { attributes: { class: "tab-group-content" }, children: content }),
      ],
    });

    this.element = el;

    return this.element;
  }
}
