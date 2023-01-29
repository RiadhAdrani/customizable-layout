import "./style.css";
import { createElement } from "@riadh-adrani/dom-control-js";
import Layout from "./Layout";
import { v4 as useId } from "uuid";

const tabs = () => [
  { element: () => createElement("div", { children: "Tab One" }), id: useId(), title: "One" },
  { element: () => createElement("div", { children: "Tab Two" }), id: useId(), title: "Two" },
];

const sl1 = new Layout(tabs(), { events: { onUnknownDropped() {} } });

const sl2 = new Layout(
  [
    new Layout(tabs(), { events: { onUnknownDropped() {} } }),
    new Layout(tabs(), { events: { onUnknownDropped() {} } }),
  ],
  {
    events: { onUnknownDropped() {} },
    isRow: false,
  }
);

const layout = new Layout([sl1, sl2], {
  events: { onUnknownDropped() {} },
});

document.querySelector(".draggable-btn")!.addEventListener("dragstart", (event) => {
  const e = event as DragEvent;
  e.dataTransfer?.clearData();
  e.dataTransfer?.setData("text/plain", JSON.stringify({ id: useId(), title: "New Tab" }));
});

document.querySelector<HTMLDivElement>("#app")!.appendChild(layout.render());
