import "./style.css";
import { createElement } from "./Dom";
import { useId } from "./Utils";
import Layout from "./Layout/Layout";
import { random } from "@riadh-adrani/utility-js";
import { Tab } from "./Tab/TabGroup";

let idx = 0;

const tab = () => ({
  element: () => createElement("div", { children: "Hello World" }),
  id: useId(),
  title: (idx++).toString(),
});

const layout1 = new Layout([tab()]);

const layout2_1 = new Layout([tab()]);

const layout2_2_1 = new Layout([tab()]);
const layout2_2_2 = new Layout([tab()]);
const layout2_2 = new Layout([new Layout([layout2_2_1, layout2_2_2])]);

const layout2 = new Layout([layout2_1, layout2_2], { isRow: false });

const layout = new Layout([layout1, layout2], {
  events: {
    onUnknownDropped: (data) => {
      const tab: Tab = {
        element: () => createElement("button", { children: "Hello World" }),
        id: (data as Record<string, string>).id,
        title: (data as Record<string, string>).title,
      };

      return tab;
    },
  },
});

const btn = createElement("button", {
  children: "New Tab",
  attributes: { draggable: "true", style: { marginBottom: "10px" } },
  events: {
    ondragstart: (e: DragEvent) => {
      e.dataTransfer?.setData(
        "text/plain",
        JSON.stringify({ id: useId(), title: `Tab ${Math.floor(random(1, 100, false))}` })
      );
    },
    onclick: () => {
      layout2.removeLayout(layout2_1.id);
    },
  },
});

document.querySelector<HTMLDivElement>("#app")!.appendChild(btn);
document.querySelector<HTMLDivElement>("#app")!.appendChild(layout.render());
