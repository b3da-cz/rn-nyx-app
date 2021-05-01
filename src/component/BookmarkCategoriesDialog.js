import React from 'react'
import { ScrollView } from 'react-native'
import { Dialog, Portal } from 'react-native-paper'
import { ButtonComponent } from '../component'
import { Styling, t } from '../lib'

export const BookmarkCategoriesDialog = ({ isVisible, isDarkMode, categories, onCategoryId, onCancel }) => {
  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={() => onCancel()}>
        <Dialog.Title>{t('categories')}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={{ marginBottom: Styling.metrics.block.large }}>
            {categories.length > 0 &&
              categories.map(c => (
                <ButtonComponent
                  key={c.id}
                  label={c.category_name}
                  lineHeight={30}
                  fontSize={Styling.metrics.fontSize.medium}
                  textAlign={'left'}
                  color={isDarkMode ? Styling.colors.lighter : Styling.colors.darker}
                  paddingHorizontal={0}
                  backgroundColor={null}
                  onPress={() => onCategoryId(c.id)}
                />
              ))}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}
