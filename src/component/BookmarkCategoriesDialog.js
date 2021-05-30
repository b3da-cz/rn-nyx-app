import React from 'react'
import { ScrollView } from 'react-native'
import { Dialog, Portal } from 'react-native-paper'
import { ButtonComponent } from '../component'
import { t, useTheme } from '../lib'

export const BookmarkCategoriesDialog = ({ isVisible, categories, onCategoryId, onCancel }) => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={() => onCancel()}>
        <Dialog.Title style={{ marginBottom: blocks.medium, marginTop: blocks.medium, marginLeft: blocks.medium }}>
          {t('categories')}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ paddingLeft: blocks.medium, paddingRight: blocks.medium }}>
          <ScrollView style={{ marginBottom: blocks.medium }}>
            {categories.length > 0 &&
              categories.map(c => (
                <ButtonComponent
                  key={c.id}
                  label={c.category_name}
                  lineHeight={30}
                  fontSize={fontSizes.p}
                  textAlign={'left'}
                  color={colors.text}
                  theme={theme}
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
