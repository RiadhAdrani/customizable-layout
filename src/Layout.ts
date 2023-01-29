import { createElement } from "@riadh-adrani/dom-control-js";
import TabGroup, { Tab, TabGroupEvents } from "./Tab/TabGroup";
import { calculateSide, useId } from "./Utils";

export interface LayoutEvents extends TabGroupEvents {
  onUnknownDropped: (ev: DragEvent) => Tab | void;
  onTabDropped?: (tab: Tab) => {};
}

export interface LayoutParams {
  isRow?: boolean;
  parent?: Layout;
  events: LayoutEvents;
}

const sides = ["top", "left", "bottom", "right", "center"];

export default class Layout {
  id: string = useId();
  group?: TabGroup = null as unknown as TabGroup;
  items: Array<Layout | Tab> = [];
  isRow = true;
  events: LayoutEvents;
  element: Element = null as unknown as Element;
  parent?: Layout;

  get upmostParent(): Layout {
    if (!this.parent) return this;

    return this.parent.upmostParent;
  }

  get hover(): HTMLElement {
    return this.element.querySelector(".custom-layout-hover")!;
  }

  get forLayouts(): boolean {
    return !this.group && this.items.every((item) => item instanceof Layout);
  }

  constructor(items: Array<Tab | Layout>, params: LayoutParams) {
    this.items = items;
    this.events = params.events;
    this.isRow = params.isRow ?? true;
    this.parent = params.parent ?? undefined;

    if (this.items.every((item) => item instanceof Layout)) {
      this.items.forEach((item) => ((item as Layout).parent = this));
    } else {
      this.group = new TabGroup(this.items as Array<Tab>, this.events);
      this.group.parent = this;
      this.items = [];
    }
  }

  findTab(id: string): { tab: Tab; group: TabGroup } | null {
    if (!this.forLayouts) {
      if (this.group!.doExist(id)) {
        const $tab = this.group!.items.find((t) => t.id === id)!;

        return { tab: $tab, group: this.group! };
      }
    }

    for (const $layout of this.items) {
      const layout = $layout as Layout;

      const res = layout.findTab(id);

      if (res) {
        return res;
      }
    }

    return null;
  }

  reBuild() {
    this.element.replaceWith(this.render());
  }

  transformTo(row: boolean) {
    if (this.forLayouts) return;

    const tabGroup = this.group;
    this.group = undefined;
    this.isRow = row;
    this.items = [new Layout(tabGroup!.items, { events: this.events, parent: this, isRow: row })];
  }

  addLayout(tabs: Array<Tab>, before: boolean, row: boolean) {
    if (this.parent) {
      const newLayout = new Layout(tabs, { events: this.events, parent: this.parent });

      if (this.parent.isRow === row) {
        const index = this.parent.items.indexOf(this) + (before ? 0 : 1);

        this.parent.items = [
          ...this.parent.items.slice(0, index),
          newLayout,
          ...this.parent.items.slice(index),
        ];
      } else {
        this.transformTo(row);

        if (before) {
          this.items.unshift(newLayout);
        } else {
          this.items.push(newLayout);
        }
      }

      this.parent.reBuild();
    } else {
      const newLayout = new Layout(tabs, { events: this.events, parent: this });

      if (before) {
        this.items.unshift(newLayout);
      } else {
        this.items.push(newLayout);
      }

      this.reBuild();
    }
  }

  transformToTabGroup() {
    if (this.items.length > 1) {
      throw `Unable to transform layout to group : Layout has 2 or more sub layouts`;
    }

    this.group = (this.items[0] as Layout).group;
    this.group!.parent = this;
    this.items = [];
    this.isRow = true;

    this.reBuild();
  }

  updateParenthood(parent?: Layout) {
    this.parent = parent;

    if (this.forLayouts) {
      (this.items as Array<Layout>).forEach((item) => item.updateParenthood(this));
    } else {
      this.group!.parent = this;
    }
  }

  removeLayout(id: string) {
    if (!this.forLayouts) return;

    if (!this.items.some((layout) => layout.id === id)) {
      throw `Layout with id "${id}" does not exist !`;
    }

    // ? remove layout with id
    this.items = this.items.filter((layout) => layout.id !== id);

    if (this.items.length === 1) {
      const item = this.items[0] as Layout;

      if (item.forLayouts) {
        this.items = item.items;
        this.isRow = item.isRow;

        this.updateParenthood(this.parent);
      } else {
        // ? if one is remaining, we transform to a tab group
        this.transformToTabGroup();
      }
    }

    this.reBuild();
  }

  onTabGroupEmptied() {
    if (this.forLayouts) return;
    if (!this.parent) return;

    this.parent.removeLayout(this.id);
  }

  render(): Element {
    const layouts = (): Array<Element> => {
      return (this.items as Array<Layout>).map((item) => item.render());
    };

    this.element = createElement("div", {
      attributes: {
        class: "custom-layout-container",
        style: `
        background-color: #2d2d2d;
        padding: ${this.forLayouts ? "0px" : "10px"};
        border-radius: 10px;
        display: flex;
        flex-direction:${this.isRow ? "row" : "column"};
        flex:1;
        align-items:stretch;
        `,
      },
      events: {
        ondrag: (ev) => ev.preventDefault(),
        ondragover: (ev) => {
          if (this.forLayouts) {
            return;
          }

          this.hover.style.display = "block";
          ev.preventDefault();

          const target = ev.currentTarget as HTMLElement;
          const side = calculateSide(ev as DragEvent);

          sides
            .filter((s) => s !== side)
            .forEach((side) => target.classList.remove(`custom-layout-container-${side}`));

          if (!target.classList.contains(`custom-layout-container-${side}`)) {
            target.classList.add(`custom-layout-container-${side}`);
          }
        },
        ondragleave: (ev) => {
          if (this.forLayouts) {
            return;
          }

          const target = ev.currentTarget as HTMLElement;

          this.hover.style.display = "none";
          sides.forEach((side) => target.classList.remove(`custom-layout-container-${side}`));
        },
        ondrop: (ev) => {
          if (this.forLayouts) {
            return;
          }

          this.hover.style.display = "none";
          ev.preventDefault();

          const target = ev.currentTarget as HTMLElement;

          sides.forEach((side) => target.classList.remove(`custom-layout-container-${side}`));

          const side = calculateSide(ev as DragEvent);
          const data = (ev as DragEvent).dataTransfer?.getData("text");
          const parsed = JSON.parse(data ?? "") as Record<string, string>;
          const org = this.upmostParent.findTab(parsed.id);

          let tab: Tab | null = null;

          if (!org) {
            const $tab = this.events.onUnknownDropped(ev as DragEvent);

            if ($tab) {
              tab = $tab;
            }
          } else {
            tab = org.tab;
          }

          if (tab) {
            // ? if org.id === this.id and the number of tabs is 1 we don't do anything;
            if (org!.group.id === this.group!.id && this.group!.items.length === 1) {
              return;
            }

            org?.group.remove(tab.id);

            switch (side) {
              case "center": {
                this.group!.add(tab);
                break;
              }
              case "right": {
                this.addLayout([tab], false, true);
                break;
              }
              case "left": {
                this.addLayout([tab], true, true);
                break;
              }
              case "top": {
                this.addLayout([tab], true, false);
                break;
              }
              case "bottom": {
                this.addLayout([tab], false, false);
                break;
              }
              default: {
                this.group!.add(tab);
              }
            }
          }
        },
      },
      children: [
        ...(this.forLayouts ? layouts() : [this.group!.render()]),
        createElement("div", {
          attributes: { class: "custom-layout-hover" },
          events: { ondrag: (e) => e.preventDefault() },
        }),
      ],
    });

    return this.element;
  }
}
