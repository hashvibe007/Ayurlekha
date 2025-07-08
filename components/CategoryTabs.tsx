import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const { width } = Dimensions.get('window');

export function CategoryTabs({ 
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryTabsProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentWidth, setContentWidth] = useState(0);

  const scrollToSelected = (index: number) => {
    if (scrollViewRef.current) {
      const itemWidth = contentWidth / categories.length;
      const x = index * itemWidth - width / 3;
      scrollViewRef.current.scrollTo({ x: Math.max(0, x), animated: true });
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onContentSizeChange={(w) => setContentWidth(w)}
    >
      {categories.map((category, index) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.tabButton,
            selectedCategory === category.id && styles.selectedTab
          ]}
          onPress={() => {
            onSelectCategory(category.id);
            scrollToSelected(index);
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategory === category.id && styles.selectedTabText
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  selectedTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#757575',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
});