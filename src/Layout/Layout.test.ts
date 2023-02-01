import { expect, it, describe, beforeEach } from "@jest/globals";
import { createElement } from "@riadh-adrani/dom-control-js";
import { range } from "@riadh-adrani/utility-js";
import { Tab } from "../Tab/TabGroup";
import { useId } from "../Utils";
import Layout from "./Layout";

describe("Layout", () => {
  const tab = () => ({ element: () => createElement("div"), id: useId(), title: "Dummy Tab" });

  describe("constructor", () => {
    it("should create a new layout with a tab group", () => {
      const layout = new Layout([tab()]);

      expect(layout.group).toBeTruthy();
      expect(layout.items.length).toBe(0);

      expect(layout.group?.parent).toStrictEqual(layout);
    });

    it("should create a new layout with a tab group", () => {
      const layout = new Layout([new Layout([tab()]), new Layout([tab()])], {});

      expect(layout.group).toBeFalsy();
      expect(layout.items.length).toBe(2);
      expect(layout.items.every((item) => item.parent === layout)).toBe(true);
    });
  });

  describe("upmostParent && isUpmostParent", () => {
    const tabs = range(5).map(
      (index) =>
        ({ element: () => createElement("div"), id: index.toString(), title: "Title" } as Tab)
    );

    const l5_2 = new Layout([tabs[3]]);
    const l5_1 = new Layout([tabs[1], tabs[2]]);
    const l4_1 = new Layout([tabs[0]]);
    const l4_2 = new Layout([l5_1, l5_2]);
    const l4_3 = new Layout([tabs[4]]);
    const l3_1 = new Layout([l4_1, l4_2]);
    const l3_2 = new Layout([l4_3]);

    const layout = new Layout([new Layout([l3_1, l3_2])]);

    it("should return self as upmost parent", () => {
      expect(layout.upmostParent === layout).toBe(true);
      expect(layout.isUpmostParent).toBeTruthy();
    });

    it.each([[l5_1], [l3_2], [l4_3]])("should return upmost parent", (l) => {
      expect(l.upmostParent === layout).toBe(true);
      expect(l.isUpmostParent).toBeFalsy();
    });
  });

  describe("forLayout", () => {
    it("should return that layout is for tabs", () => {
      const layout = new Layout([tab()]);

      expect(layout.forLayout).toBe(false);
    });
    it("should return that layout is for tabs", () => {
      const layout = new Layout([new Layout([tab()]), new Layout([tab()])]);

      expect(layout.forLayout).toBe(true);
    });
  });

  describe("findTab", () => {
    const tabs = range(5).map(
      (index) =>
        ({ element: () => createElement("div"), id: index.toString(), title: "Title" } as Tab)
    );

    let layout: Layout;

    beforeEach(() => {
      layout = new Layout(tabs);
    });

    it("should find existing tab", () => {
      const res = layout.findTab("0");

      expect(res?.tab).toStrictEqual(tabs[0]);
      expect(res?.group).toStrictEqual(layout.group);
    });

    it("should return null for non-existing tab", () => {
      const res = layout.findTab("a");

      expect(res).toStrictEqual(null);
    });

    it("should find tab in a nested layout", () => {
      const l5_2 = new Layout([tabs[3]]);
      const l5_1 = new Layout([tabs[1], tabs[2]]);
      const l4_1 = new Layout([tabs[0]]);
      const l4_2 = new Layout([l5_1, l5_2]);
      const l4_3 = new Layout([tabs[4]]);
      const l3_1 = new Layout([l4_1, l4_2]);
      const l3_2 = new Layout([l4_3]);

      layout = new Layout([new Layout([l3_1, l3_2])]);

      const res = layout.findTab("3");
      expect(res?.tab).toStrictEqual(tabs[3]);
      expect(res?.group === l5_2.group).toBe(true);

      const res2 = layout.findTab("2");
      expect(res2?.tab).toStrictEqual(tabs[2]);
      expect(res2?.group === l5_1.group).toBe(true);
    });
  });

  describe("ToLayoutGroup", () => {
    it("should transform a tab layout to a row layout", () => {
      const layout = new Layout([tab()]);

      expect(layout.items.length).toBe(0);

      layout.toLayoutGroup(true);

      expect(layout.group === undefined).toBe(true);
      expect(layout.isRow).toBe(true);
      expect(layout.forLayout).toBe(true);
      expect(layout.items.length).toBe(1);
    });

    it("should transform a tab layout to a column layout", () => {
      const layout = new Layout([tab()]);

      expect(layout.items.length).toBe(0);

      layout.toLayoutGroup(false);

      expect(layout.group === undefined).toBe(true);
      expect(layout.isRow).toBe(false);
      expect(layout.forLayout).toBe(true);
      expect(layout.items.length).toBe(1);
    });

    it("should transform a row layout to a column layout", () => {
      const layout = new Layout([new Layout([tab()]), new Layout([tab()])]);

      layout.toLayoutGroup(false);

      expect(layout.group === undefined).toBe(true);
      expect(layout.isRow).toBe(false);
      expect(layout.forLayout).toBe(true);
    });

    it("should transform a column layout to a row layout", () => {
      const layout = new Layout([new Layout([tab()]), new Layout([tab()])], {
        isRow: false,
      });

      layout.toLayoutGroup(true);

      expect(layout.group === undefined).toBe(true);
      expect(layout.isRow).toBe(true);
      expect(layout.forLayout).toBe(true);
    });
  });

  describe("ToTabGroup", () => {
    it("should throw when the number of layout is more different than one", () => {
      const layout0 = new Layout([]);
      expect(() => layout0.toTabGroup()).toThrow();

      const layout2 = new Layout([new Layout([tab()]), new Layout([tab()])]);
      expect(() => layout2.toTabGroup()).toThrow();
    });

    it("should transform a layout with one child layout to a tab layout", () => {
      const layout = new Layout([new Layout([tab()])]);

      // we render because the Layout needs to be repainted
      layout.render();
      layout.toTabGroup();

      expect(layout.items.length).toBe(0);
      expect(layout.isRow).toBe(true);
      expect(layout.group?.parent === layout).toBe(true);
    });
  });

  describe("addLayout", () => {
    it("should throw when no tabs are provided", () => {
      const layout = new Layout([tab()]);

      expect(() => layout.addLayout([], false, true)).toThrow();
    });

    describe("parent-less", () => {
      const tab1 = tab();
      const tab2 = tab();
      const tab3 = tab();

      let layout: Layout;

      beforeEach(() => {
        layout = new Layout([tab1, tab2]);
        layout.render();
      });

      it("should add tab to the left", () => {
        layout.addLayout([tab3], true, true);

        expect(layout.forLayout).toBe(true);
        expect(layout.group).toBeUndefined();

        expect(layout.items.length).toBe(2);

        expect(layout.items[0].forLayout).toBeFalsy();
        expect(layout.items[0].group).toBeTruthy();
        expect(layout.items[0].group?.items.length).toBe(1);
        expect(layout.items[0].group?.items[0] === tab3).toBeTruthy();

        expect(layout.items[1].forLayout).toBeFalsy();
        expect(layout.items[1].group).toBeTruthy();
        expect(layout.items[1].group?.items.length).toBe(2);
        expect(layout.items[1].group?.items[0] === tab1).toBeTruthy();
        expect(layout.items[1].group?.items[1] === tab2).toBeTruthy();
      });

      it("should add tab to the right", () => {
        layout.addLayout([tab3], false, true);

        expect(layout.forLayout).toBe(true);
        expect(layout.group).toBeUndefined();

        expect(layout.items.length).toBe(2);

        expect(layout.items[0].forLayout).toBeFalsy();
        expect(layout.items[0].group).toBeTruthy();
        expect(layout.items[0].group?.items.length).toBe(2);
        expect(layout.items[0].group?.items[0] === tab1).toBeTruthy();
        expect(layout.items[0].group?.items[1] === tab2).toBeTruthy();

        expect(layout.items[1].forLayout).toBeFalsy();
        expect(layout.items[1].group).toBeTruthy();
        expect(layout.items[1].group?.items.length).toBe(1);
        expect(layout.items[1].group?.items[0] === tab3).toBeTruthy();
      });

      it("should add tab to the top", () => {
        layout.addLayout([tab3], true, false);

        expect(layout.forLayout).toBe(true);
        expect(layout.group).toBeUndefined();
        expect(layout.isRow).toBeFalsy();

        expect(layout.items.length).toBe(2);

        expect(layout.items[0].forLayout).toBeFalsy();
        expect(layout.items[0].group).toBeTruthy();
        expect(layout.items[0].group?.items.length).toBe(1);
        expect(layout.items[0].group?.items[0] === tab3).toBeTruthy();

        expect(layout.items[1].forLayout).toBeFalsy();
        expect(layout.items[1].group).toBeTruthy();
        expect(layout.items[1].group?.items.length).toBe(2);
        expect(layout.items[1].group?.items[0] === tab1).toBeTruthy();
        expect(layout.items[1].group?.items[1] === tab2).toBeTruthy();
      });

      it("should add tab to the bottom", () => {
        layout.addLayout([tab3], false, false);

        expect(layout.forLayout).toBe(true);
        expect(layout.group).toBeUndefined();

        expect(layout.items.length).toBe(2);

        expect(layout.items[0].forLayout).toBeFalsy();
        expect(layout.items[0].group).toBeTruthy();
        expect(layout.items[0].group?.items.length).toBe(2);
        expect(layout.items[0].group?.items[0] === tab1).toBeTruthy();
        expect(layout.items[0].group?.items[1] === tab2).toBeTruthy();

        expect(layout.items[1].forLayout).toBeFalsy();
        expect(layout.items[1].group).toBeTruthy();
        expect(layout.items[1].group?.items.length).toBe(1);
        expect(layout.items[1].group?.items[0] === tab3).toBeTruthy();
      });
    });

    describe("parent", () => {
      const tab1 = tab();
      const tab2 = tab();
      const tab3 = tab();
      const tab4 = tab();
      const tab5 = tab();
      const tab6 = tab();
      const tab7 = tab();

      let parent: Layout;
      let layout: Layout;

      describe("parent:Row", () => {
        beforeEach(() => {
          layout = new Layout([tab1, tab2]);
          parent = new Layout([new Layout([tab3]), layout, new Layout([tab4, tab5, tab6])]);

          parent.render();
        });

        it("[left] should add layout to parent just before the target layout", () => {
          layout.addLayout([tab7], true, true);

          expect(parent.isRow).toBe(true);
          expect(parent.items.length).toBe(4);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          // newly inserted layout
          expect(parent.items[1].forLayout).toBeFalsy();
          expect(parent.items[1].group).toBeDefined();
          expect(parent.items[1].group?.items.length).toBe(1);
          expect(parent.items[1].group?.items[0] === tab7).toBeTruthy();

          // target tab
          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(2);
          expect(parent.items[2].group?.items[0] === tab1).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab2).toBeTruthy();

          expect(parent.items[3].forLayout).toBeFalsy();
          expect(parent.items[3].group).toBeDefined();
          expect(parent.items[3].group?.items.length).toBe(3);
          expect(parent.items[3].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[3].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[3].group?.items[2] === tab6).toBeTruthy();
        });

        it("[right] should add layout to parent just after the target layout", () => {
          layout.addLayout([tab7], false, true);

          expect(parent.isRow).toBe(true);
          expect(parent.items.length).toBe(4);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          // target tab
          expect(parent.items[1].forLayout).toBeFalsy();
          expect(parent.items[1].group).toBeDefined();
          expect(parent.items[1].group?.items.length).toBe(2);
          expect(parent.items[1].group?.items[0] === tab1).toBeTruthy();
          expect(parent.items[1].group?.items[1] === tab2).toBeTruthy();

          // newly inserted layout
          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(1);
          expect(parent.items[2].group?.items[0] === tab7).toBeTruthy();

          expect(parent.items[3].forLayout).toBeFalsy();
          expect(parent.items[3].group).toBeDefined();
          expect(parent.items[3].group?.items.length).toBe(3);
          expect(parent.items[3].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[3].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[3].group?.items[2] === tab6).toBeTruthy();
        });

        it("[top] should transform the target layout to column and insert the layout at the beginning", () => {
          layout.addLayout([tab7], true, false);

          expect(parent.isRow).toBe(true);
          expect(parent.items.length).toBe(3);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(3);
          expect(parent.items[2].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[2].group?.items[2] === tab6).toBeTruthy();

          expect(parent.items[1] === layout).toBeTruthy();

          expect(layout.forLayout).toBeTruthy();
          expect(layout.group).toBeUndefined();
          expect(layout.isRow).toBeFalsy();

          expect(layout.items.length).toBe(2);

          // inserted layout
          expect(layout.items[0].forLayout).toBeFalsy();
          expect(layout.items[0].parent === layout).toBeTruthy();
          expect(layout.items[0].group).toBeDefined();
          expect(layout.items[0].group?.parent === layout.items[0]).toBeTruthy();
          expect(layout.items[0].group?.items.length).toBe(1);
          expect(layout.items[0].group?.items[0] === tab7).toBeTruthy();

          expect(layout.items[1].forLayout).toBeFalsy();
          expect(layout.items[1].parent === layout).toBeTruthy();
          expect(layout.items[1].group).toBeDefined();
          expect(layout.items[1].group?.parent === layout.items[1]).toBeTruthy();
          expect(layout.items[1].group?.items.length).toBe(2);
          expect(layout.items[1].group?.items[0] === tab1).toBeTruthy();
          expect(layout.items[1].group?.items[1] === tab2).toBeTruthy();
        });

        it("[bottom] should transform the target layout to column and insert the layout at the end", () => {
          layout.addLayout([tab7], false, false);

          expect(parent.isRow).toBe(true);
          expect(parent.items.length).toBe(3);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(3);
          expect(parent.items[2].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[2].group?.items[2] === tab6).toBeTruthy();

          expect(parent.items[1] === layout).toBeTruthy();

          expect(layout.forLayout).toBeTruthy();
          expect(layout.group).toBeUndefined();
          expect(layout.isRow).toBeFalsy();

          expect(layout.items.length).toBe(2);

          // inserted layout
          expect(layout.items[1].forLayout).toBeFalsy();
          expect(layout.items[1].parent === layout).toBeTruthy();
          expect(layout.items[1].group).toBeDefined();
          expect(layout.items[1].group?.parent === layout.items[1]).toBeTruthy();
          expect(layout.items[1].group?.items.length).toBe(1);
          expect(layout.items[1].group?.items[0] === tab7).toBeTruthy();

          expect(layout.items[0].forLayout).toBeFalsy();
          expect(layout.items[0].parent === layout).toBeTruthy();
          expect(layout.items[0].group).toBeDefined();
          expect(layout.items[0].group?.parent === layout.items[0]).toBeTruthy();
          expect(layout.items[0].group?.items.length).toBe(2);
          expect(layout.items[0].group?.items[0] === tab1).toBeTruthy();
          expect(layout.items[0].group?.items[1] === tab2).toBeTruthy();
        });
      });

      describe("parent:Column", () => {
        beforeEach(() => {
          layout = new Layout([tab1, tab2]);
          parent = new Layout([new Layout([tab3]), layout, new Layout([tab4, tab5, tab6])], {
            isRow: false,
          });

          parent.render();
        });

        it("[top] should add layout to parent just before the target layout", () => {
          layout.addLayout([tab7], true, false);

          expect(parent.isRow).toBe(false);
          expect(parent.items.length).toBe(4);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          // newly inserted layout
          expect(parent.items[1].forLayout).toBeFalsy();
          expect(parent.items[1].group).toBeDefined();
          expect(parent.items[1].group?.items.length).toBe(1);
          expect(parent.items[1].group?.items[0] === tab7).toBeTruthy();

          // target tab
          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(2);
          expect(parent.items[2].group?.items[0] === tab1).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab2).toBeTruthy();

          expect(parent.items[3].forLayout).toBeFalsy();
          expect(parent.items[3].group).toBeDefined();
          expect(parent.items[3].group?.items.length).toBe(3);
          expect(parent.items[3].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[3].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[3].group?.items[2] === tab6).toBeTruthy();
        });

        it("[bottom] should add layout to parent just after the target layout", () => {
          layout.addLayout([tab7], false, false);

          expect(parent.isRow).toBe(false);
          expect(parent.items.length).toBe(4);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          // target tab
          expect(parent.items[1].forLayout).toBeFalsy();
          expect(parent.items[1].group).toBeDefined();
          expect(parent.items[1].group?.items.length).toBe(2);
          expect(parent.items[1].group?.items[0] === tab1).toBeTruthy();
          expect(parent.items[1].group?.items[1] === tab2).toBeTruthy();

          // newly inserted layout
          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(1);
          expect(parent.items[2].group?.items[0] === tab7).toBeTruthy();

          expect(parent.items[3].forLayout).toBeFalsy();
          expect(parent.items[3].group).toBeDefined();
          expect(parent.items[3].group?.items.length).toBe(3);
          expect(parent.items[3].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[3].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[3].group?.items[2] === tab6).toBeTruthy();
        });

        it("[left] should transform the target layout to row and insert the layout at the beginning", () => {
          layout.addLayout([tab7], true, true);

          expect(parent.isRow).toBe(false);
          expect(parent.items.length).toBe(3);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(3);
          expect(parent.items[2].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[2].group?.items[2] === tab6).toBeTruthy();

          expect(parent.items[1] === layout).toBeTruthy();

          expect(layout.forLayout).toBeTruthy();
          expect(layout.group).toBeUndefined();
          expect(layout.isRow).toBe(true);

          expect(layout.items.length).toBe(2);

          // inserted layout
          expect(layout.items[0].forLayout).toBeFalsy();
          expect(layout.items[0].parent === layout).toBeTruthy();
          expect(layout.items[0].group).toBeDefined();
          expect(layout.items[0].group?.parent === layout.items[0]).toBeTruthy();
          expect(layout.items[0].group?.items.length).toBe(1);
          expect(layout.items[0].group?.items[0] === tab7).toBeTruthy();

          expect(layout.items[1].forLayout).toBeFalsy();
          expect(layout.items[1].parent === layout).toBeTruthy();
          expect(layout.items[1].group).toBeDefined();
          expect(layout.items[1].group?.parent === layout.items[1]).toBeTruthy();
          expect(layout.items[1].group?.items.length).toBe(2);
          expect(layout.items[1].group?.items[0] === tab1).toBeTruthy();
          expect(layout.items[1].group?.items[1] === tab2).toBeTruthy();
        });

        it("[bottom] should transform the target layout to row and insert the layout at the end", () => {
          layout.addLayout([tab7], false, true);

          expect(parent.isRow).toBe(false);
          expect(parent.items.length).toBe(3);

          expect(parent.items[0].forLayout).toBeFalsy();
          expect(parent.items[0].group).toBeDefined();
          expect(parent.items[0].group?.items.length).toBe(1);
          expect(parent.items[0].group?.items[0] === tab3).toBeTruthy();

          expect(parent.items[2].forLayout).toBeFalsy();
          expect(parent.items[2].group).toBeDefined();
          expect(parent.items[2].group?.items.length).toBe(3);
          expect(parent.items[2].group?.items[0] === tab4).toBeTruthy();
          expect(parent.items[2].group?.items[1] === tab5).toBeTruthy();
          expect(parent.items[2].group?.items[2] === tab6).toBeTruthy();

          expect(parent.items[1] === layout).toBeTruthy();

          expect(layout.forLayout).toBeTruthy();
          expect(layout.group).toBeUndefined();
          expect(layout.isRow).toBe(true);

          expect(layout.items.length).toBe(2);

          // inserted layout
          expect(layout.items[1].forLayout).toBeFalsy();
          expect(layout.items[1].parent === layout).toBeTruthy();
          expect(layout.items[1].group).toBeDefined();
          expect(layout.items[1].group?.parent === layout.items[1]).toBeTruthy();
          expect(layout.items[1].group?.items.length).toBe(1);
          expect(layout.items[1].group?.items[0] === tab7).toBeTruthy();

          expect(layout.items[0].forLayout).toBeFalsy();
          expect(layout.items[0].parent === layout).toBeTruthy();
          expect(layout.items[0].group).toBeDefined();
          expect(layout.items[0].group?.parent === layout.items[0]).toBeTruthy();
          expect(layout.items[0].group?.items.length).toBe(2);
          expect(layout.items[0].group?.items[0] === tab1).toBeTruthy();
          expect(layout.items[0].group?.items[1] === tab2).toBeTruthy();
        });
      });
    });
  });

  describe("removeLayout", () => {});
});
