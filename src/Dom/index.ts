import { StringWithAutoComplete, isBlank } from "@riadh-adrani/utility-js";
import { isArray, isObject, capitalize } from "@riadh-adrani/utility-js";

export type Arrayable<T> = T | Array<T>;

export type DomAttribute = string | boolean | Record<string, unknown> | undefined | null;

export type DomEventTarget<C = HTMLElement> = Element & EventTarget & C;

export type DomEvent<E = Event, C = HTMLElement> = Event &
  E & {
    target: DomEventTarget<HTMLElement>;
    currentTarget: DomEventTarget<C>;
  };

export type DomEventHandler<El = HTMLElement, Ev = Event> = (event: DomEvent<Ev, El>) => void;

export type DomChild = string | number | null | undefined | Element | Text;

export const SVG_NS = "http://www.w3.org/2000/svg";
export const HTML_NS = "http://www.w3.org/1999/xhtml";
export const MATH_NS = "http://www.w3.org/1998/Math/MathML";

export type DomNamespace = typeof SVG_NS | typeof HTML_NS | typeof MATH_NS;

export type DomElementOptions = {
  attributes?: Record<string, Arrayable<DomAttribute>>;
  events?: Record<string, DomEventHandler<any, any>>;
  children?: Arrayable<DomChild>;
  namespace?: DomNamespace;
};

export type DomTagName = StringWithAutoComplete<keyof HTMLElementTagNameMap>;

export type DomEventName = StringWithAutoComplete<`on${keyof DocumentEventMap}`>;

export const togglableAttributes = [
  "contenteditable",
  "autofocus",
  "autoplay",
  "allowfullscreen",
  "allowpaymentreques",
  "checked",
  "controls",
  "compact",
  "disabled",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "open",
  "playsinline",
  "readonly",
  "required",
  "selected",
  "async",
  "defer",
];

/**
 * return if the given attribute is a standard togglable one.
 * @param attribute attribute name
 */
export const isTogglableAttribute = (attribute: string): boolean => {
  return togglableAttributes.includes(attribute.trim());
};

/**
 * check if a given attributes is toggled on.
 *
 * If a non-standard toggleable attribute name is provided, it will return false;
 *
 * @param attribute name
 * @param element target element
 */
export const isToggledOn = (attribute: string, element: Element): boolean => {
  return isTogglableAttribute(attribute) && (element as any)[attribute] === true;
};

/**
 * toggle the given attribute.
 * @param attribute name
 * @param value optional force value
 * @param element target element
 */
export const toggleAttribute = (attribute: string, element: Element, value?: boolean): void => {
  if (value !== undefined) {
    element.toggleAttribute(attribute, value === true);
    (element as any)[attribute] = value === true;
  } else {
    element.toggleAttribute(attribute);
  }
};

/**
 * set the value of an element's attribute with the given name.
 * @param attribute name
 * @param value value
 * @param element target element
 */
export const setAttribute = (
  attribute: string,
  value: Arrayable<DomAttribute>,
  element: Element
): void => {
  if (togglableAttributes.includes(attribute)) {
    toggleAttribute(attribute, element, value as boolean);
  } else {
    let $value: DomAttribute = "";

    if (isObject(value) && !isArray(value)) {
      Object.keys(value as Record<string, unknown>).forEach((key: string) => {
        const $v = (value as Record<string, string>)[key];

        const $computed = isArray($v) ? ($v as unknown as Array<string>).join(" ") : $v;

        switch (attribute) {
          case "dataset": {
            setAttribute(`data-${key}`, $computed, element);
            break;
          }
          case "style": {
            ((element as HTMLElement).style as unknown as Record<string, string>)[key] = $computed;
            break;
          }
        }
      });

      return;
    }

    if (isArray(value)) {
      $value = (value as Array<DomAttribute>).join(" ");
    } else {
      $value = value as DomAttribute;
    }

    element.setAttribute(attribute, $value as string);

    if (attribute === "class") {
      (element as any)["className"] = $value;
    } else {
      const $attr = attribute
        .split("-")
        .map((t, i) => (i !== 0 ? capitalize(t) : t))
        .join("");

      (element as any)[$attr] = $value;
    }
  }
};

/**
 * remove the element's attribute with the given name.
 * @param attribute name
 * @param element target element
 */
export const removeAttribute = (attribute: string, element: Element): void => {
  if (isTogglableAttribute(attribute)) {
    toggleAttribute(attribute, element, false);
  } else {
    element.removeAttribute(attribute);
  }
};

/**
 * check if the given name is an event name.
 * - `onclick` or `oninput` are valid.
 * - `click` or `input` are not valid.
 *
 * @param name event name
 */
export const isOnEventName = (name: string): boolean => {
  if (typeof name !== "string") return false;

  const onEventRegex = /on[a-z]{1,}/;

  if (!onEventRegex.test(name)) {
    return false;
  }

  return true;
};

/**
 * add an event with the given name to the target element.
 * @param name event name.
 * @param callback callback
 * @param element target element
 */
export const setEvent = <T = Event, E = Element>(
  name: string,
  callback: DomEventHandler<E, T>,
  element: E
) => {
  if (element instanceof Element === false) return;
  if (typeof callback !== "function") return;

  if (!isOnEventName(name)) {
    return;
  }

  (element as Record<string, any>)[name] = callback;
};

/**
 * removes given element named event.
 * @param name event name.
 * @param element target element
 */
export const removeEvent = (name: string, element: Element) => {
  if (element instanceof Element === false) return;

  if (!isOnEventName(name)) {
    return;
  }

  (element as any)[name] = null;
};

/**
 * Check if the given element is a text node.
 * @param object target
 */
export const isTextNode = (object: unknown): boolean => {
  return object instanceof Text;
};

/**
 * 
 Check if the given object is an HTML element.
 * @param object target 
 */
export const isElement = (object: unknown): boolean => {
  return object instanceof Element;
};

/**
 * create and return a text node with the given data.
 * @param data content
 */
export const createTextNode = (data: string) => {
  return document.createTextNode(data);
};

/**
 * update the content of a text node.
 * @param textNode target
 * @param data new data
 */
export const setTextNodeData = (textNode: Text, data: string) => {
  if (isTextNode(textNode)) {
    textNode.data = data;
  }
};

/**
 * create an element with the given options.
 * @param tag existing or custom tag.
 * @param params element options
 */
export const createElement = <T = Element>(tag: DomTagName, params?: DomElementOptions): T => {
  if (isBlank(tag)) throw new Error("tag cannot be empty.");

  const ns = params?.namespace ?? "http://www.w3.org/1999/xhtml";

  const el = document.createElementNS(ns, tag);

  if (params && params.attributes) {
    Object.keys(params.attributes as object).forEach((key) => {
      setAttribute(key, params.attributes!![key], el);
    });
  }

  if (params && params.events) {
    Object.keys(params.events as object).forEach((key) => {
      setEvent(key, params.events!![key], el as HTMLElement);
    });
  }

  if (params && params.children) {
    const children = params.children;

    if (!Array.isArray(children)) {
      injectNode(children as DomChild, el);
    } else {
      children.forEach((child) => {
        injectNode(child as DomChild, el);
      });
    }
  }

  return el as T;
};

/**
 * Insert an element within a container in a given position.
 * @param element element
 * @param parent containing element
 * @param index the index in which the element will be injected. if the index is larger than the number of the parent's children or is negative, it will be injected at the end.
 */
export const injectNode = (element: DomChild, parent: Element, index?: number): void => {
  let node: Element | Text;

  if (isElement(element) || isTextNode(element)) {
    node = element as Element | Text;
  } else {
    node = createTextNode(element as string);
  }

  if (typeof index === "number" && index > -1) {
    parent.insertBefore(node, parent.children[index]);
  } else {
    parent.append(node);
  }
};

/**
 * Check if the given element is container within the parent element.
 *
 * Text nodes are not detected.
 *
 * @param element target
 * @param parentElement container
 */
export const isElementWithinElement = (element: unknown, parentElement: Element): boolean => {
  if (element instanceof Node === false) return false;
  if (!isElement(parentElement)) return false;

  return parentElement.contains(element as any);
};

/**
 * Check if the body of the document contains the given element.
 * @param element target element
 */
export const isElementInDocument = (element: any): boolean => {
  return isElementWithinElement(element, document.body);
};

/**
 * Return the index of the given element inside its parent container.
 *
 * @throws an error if the element does not have a parent element.
 * @param element target
 */
export const getElementPosition = (element: Element): number => {
  return Array.from(element.parentElement!.children).indexOf(element);
};

/**
 * retrieve the number of children within the given element.
 *
 * if `element` is not of type `Element`, -1 will be returned instead.
 *
 * Note that `Text` nodes are not considered as element children.
 *
 * @param element target
 * @returns number of children
 */
export const getElementChildrenCount = (element: Element): number => {
  if (!isElement(element)) return -1;

  return element.childElementCount;
};

/**
 * removes the element's children at the given position and return it if it exists, else it return `false`.
 * @param element parent element
 * @param position child index
 */
export const removeChildAtPosition = (element: Element, position: number): ChildNode | false => {
  if (getElementChildrenCount(element) - 1 < position) return false;

  return element.removeChild(element.childNodes.item(position));
};

/**
 * change the position of the given element inside its parent.
 *
 * if the element is not of type `Element` or does not has a parent, the function will exit.
 *
 * @param element target
 * @param newPosition new position
 */
export const changeChildPosition = (element: Element, newPosition: number): void => {
  if (!isElement(element)) return;

  const parent = element.parentElement!;

  if (!isElement(parent)) return;

  injectNode(element, parent, newPosition);
};

/**
 * remove the given node
 * @param node target
 */
export const removeNode = (node: Element | Text) => {
  if (isElement(node) || isTextNode(node)) {
    node.remove();
  }
};

/**
 * replace the given element with the new one.
 * @param element target element
 * @param newElement replacing element
 */
export const replaceNodeWith = (element: Element | Text, newElement: Element | Text) => {
  if (
    (isElement(element) || isTextNode(element)) &&
    (isElement(newElement) || isTextNode(newElement))
  ) {
    element.replaceWith(newElement);
  }
};
