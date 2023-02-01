import "./style.css";
import { createElement } from "@riadh-adrani/dom-control-js";
import { useId } from "./Utils";
import Layout from "./Layout/Layout";

const tab = () => ({
  element: () => createElement("div", { children: "Hello World" }),
  id: useId(),
  title: "Tab Title",
});

const layout = new Layout([
  new Layout([tab(), tab()]),
  new Layout([new Layout([tab(), tab()]), new Layout([tab()])], {
    isRow: false,
    events: {
      onUnknownDropped() {
        return {
          element: () => createElement("button", { children: "Hello World" }),
          id: useId(),
          title: "New Title",
        };
      },
    },
  }),
]);

document.querySelector<HTMLDivElement>("#app")!.appendChild(layout.render());
