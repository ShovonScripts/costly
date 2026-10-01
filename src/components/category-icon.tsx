import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { getCategorySymbolName } from '@/constants/categories';

export function CategoryIcon({
  category,
  customIcons,
  color,
  size = 18,
  containerSize = 32,
}: {
  category: string;
  customIcons?: Record<string, string>;
  color: string;
  size?: number;
  containerSize?: number;
}) {
  const name = getCategorySymbolName(category, customIcons);
  return (
    <View style={[styles.container, { width: containerSize, height: containerSize, backgroundColor: `${color}22` }]}>
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
