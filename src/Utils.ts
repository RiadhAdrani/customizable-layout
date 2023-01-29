import { isInInterval } from "@riadh-adrani/utility-js";
import { v4 } from "uuid";

export const useId = () => v4();

export const calculateSide = (e: DragEvent): string => {
  const target = e.currentTarget as HTMLElement;

  const rect = target.getBoundingClientRect();

  const ratio = 0.2;

  const width = rect.width;
  const height = rect.height;

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isInInterval(0, x, width * ratio)) {
    return "left";
  } else if (isInInterval(width * (1 - ratio), x, width)) {
    return "right";
  } else if (isInInterval(0, y, height * ratio)) {
    return "top";
  } else if (isInInterval(height * (1 - ratio), y, height)) {
    return "bottom";
  }

  return "center";
};
