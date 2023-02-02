import { expect, it, describe, beforeEach, jest } from "@jest/globals";
import { createElement } from "../Dom";
import TabGroup, { Tab } from "./TabGroup";

describe("TabGroup", () => {
  let group: TabGroup;

  beforeEach(() => {
    group = new TabGroup([
      {
        id: "id-1",
        title: "Title 1",
        element: () => createElement("div", { children: "Content 1" }),
      },
      {
        id: "id-2",
        title: "Title 2",
        element: () => createElement("div", { children: "Content 2" }),
      },
      {
        id: "id-3",
        title: "Title 3",
        element: () => createElement("div", { children: "Content 3" }),
      },
    ]);

    document.body.innerHTML = "";
    document.body.appendChild(group.render());
  });

  it("should render correctly", () => {
    const tabs = group.element.querySelector(".tab-group-tabs") as HTMLElement;
    const content = group.element.querySelector(".tab-group-content") as HTMLElement;

    expect(tabs.querySelectorAll(".tab-group-btn").length).toBe(3);
    expect(content.innerHTML).toBe("<div>Content 1</div>");
  });

  it("should determine if a tab exists", () => {
    expect(group.doExist("id-1")).toBe(true);
    expect(group.doExist("id-2")).toBe(true);
    expect(group.doExist("id-not-existing")).toBe(false);
  });

  it("should determine if a given tab is active", () => {
    expect(group.isActive("id-1")).toBe(true);
    expect(group.isActive("id-2")).toBe(false);
  });

  it("should toggle to another tab", () => {
    group.toggle("id-2");

    const oldBtn = group.getTabButtonById("id-1");
    const newBtn = group.getTabButtonById("id-2");

    expect(group.contentElement.innerHTML).toBe("<div>Content 2</div>");
    expect(oldBtn.dataset.active).toBe("false");
    expect(newBtn.dataset.active).toBe("true");
  });

  it("should not toggle to a non existing tab", () => {
    group.toggle("id-non-existing");

    const btn = group.getTabButtonById("id-1");

    expect(group.contentElement.innerHTML).toBe("<div>Content 1</div>");
    expect(btn.dataset.active).toBe("true");
  });

  it("should execute toggle hooks", () => {
    const stack: Array<string> = [];

    group.events = {
      onBeforeTabToggle() {
        stack.push("before-tab-toggle");
      },
      onTabToggled() {
        stack.push("tab-toggled");
      },
    };

    group.toggle("id-2");

    expect(stack).toStrictEqual(["before-tab-toggle", "tab-toggled"]);
  });

  it("should not execute hooks when id is the same", () => {
    const stack: Array<string> = [];

    group.events = {
      onBeforeTabToggle() {
        stack.push("before-tab-toggle");
      },
      onTabToggled() {
        stack.push("tab-toggled");
      },
    };

    group.toggle("id-1");

    expect(stack).toStrictEqual([]);
  });

  it("should add a new tab", () => {
    const newTab: Tab = {
      id: "id-new",
      title: "New Tab",
      element: () => createElement("button", { children: "New Tab" }),
    };

    group.add(newTab);

    expect(group.activeId).toBe("id-new");
    expect(group.items.length).toBe(4);
    expect(group.contentElement.innerHTML).toBe("<button>New Tab</button>");
  });

  it("should run mount hooks", () => {
    const stack: Array<string> = [];

    group.events = {
      onBeforeTabAdd() {
        stack.push("before-tab-add");
      },
      onTabAdded() {
        stack.push("tab-added");
      },
    };

    const newTab: Tab = {
      id: "id-new",
      title: "New Tab",
      element: () => {
        return createElement("button", { children: "New Tab" });
      },
      onBeforeMount: () => {
        stack.push("before-mount");
      },
      onMounted: () => {
        stack.push("mounted");
      },
    };

    group.add(newTab);

    expect(stack).toStrictEqual(["before-tab-add", "before-mount", "mounted", "tab-added"]);
  });

  it("should throw when the added new tab id exists", () => {
    const newTab: Tab = {
      id: "id-1",
      title: "New Tab",
      element: () => createElement("button", { children: "New Tab" }),
    };

    expect(() => group.add(newTab)).toThrow();
  });

  it("should remove tab", () => {
    group.remove("id-1");

    expect(group.items.length).toBe(2);
    expect(group.activeId).toBe("id-2");
  });

  it("should run unmount hooks", () => {
    const stack: Array<string> = [];

    group.events = {
      onBeforeTabRemove() {
        stack.push("before-remove");
      },
      onTabRemoved() {
        stack.push("removed");
      },
    };

    group.remove("id-1");

    expect(stack).toStrictEqual(["before-remove", "removed"]);
  });

  it("should run onEmptied when last tab is removed", () => {
    const fn = jest.fn(() => {});

    group.onEmptied = fn;

    group.remove("id-1");
    group.remove("id-2");
    group.remove("id-3");

    expect(fn).toHaveBeenCalled();
  });
});
