// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "globe": "language",
  "arrow.down.circle.fill": "file-download",
  "folder.fill": "folder",
  "person.fill": "person",
  "lock.fill": "lock",
  "envelope.fill": "email",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "arrow.clockwise": "refresh",
  "xmark.circle.fill": "cancel",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "arrow.down.to.line": "download",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "doc.fill": "description",
  "photo.fill": "image",
  "film.fill": "movie",
  "app.fill": "apps",
  "gearshape.fill": "settings",
  "arrow.left": "arrow-back",
  "magnifyingglass": "search",
  "plus": "add",
  "info.circle.fill": "info",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
