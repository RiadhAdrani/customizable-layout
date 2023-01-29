import "./style.css";
import { createElement } from "@riadh-adrani/dom-control-js";
import TabGroup from "./Tab/TabGroup";

const tab = new TabGroup([{ element: () => createElement("div"), id: "id", title: "Tab Title" }]);

document.querySelector<HTMLDivElement>("#app")!.appendChild(tab.render());
