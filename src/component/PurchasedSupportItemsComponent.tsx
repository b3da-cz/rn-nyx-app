import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Badge, TouchableRipple } from 'react-native-paper'
import { FoodPictogramComponent } from './FoodPictogramComponent'
import { IapService, SUPPORT_PRODUCTS, SupportProduct, Theme } from '../lib'

type Props = {
  navigation: any
  theme: Theme
}

export const PurchasedSupportItemsComponent: React.FC<Props> = ({ navigation, theme }) => {
  const [purchases, setPurchases] = useState<Record<string, number>>({})

  const loadPurchases = async () => {
    try {
      const items = await IapService.syncPurchasesIfNeeded()
      setPurchases(items || {})
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadPurchases()
    const unsubscribe = navigation?.addListener ? navigation.addListener('focus', loadPurchases) : undefined
    return () => {
      unsubscribe?.()
    }
  }, [navigation])

  const purchasedList = SUPPORT_PRODUCTS.map(product => ({
    product,
    count: purchases[product.sku] || 0,
  })).filter(item => item.count > 0)

  if (purchasedList.length === 0) {
    return null
  }

  return (
    <TouchableRipple
      rippleColor={theme.colors.ripple}
      onPress={() => navigation?.push?.('support')}
      style={{
        width: '100%',
        backgroundColor: theme.colors.surface,
        marginBottom: theme.metrics.blocks.small,
        height: theme.metrics.blocks.rowDiscussion,
        justifyContent: 'center',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: '100%', paddingHorizontal: theme.metrics.blocks.medium }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', height: '100%' }}>
          {purchasedList.map(({ product, count }) => (
            <View
              key={product.sku}
              style={{
                marginRight: theme.metrics.blocks.large + 6,
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                <FoodPictogramComponent name={product.icon} color={theme.colors.primary} size={20} />
                {count > 1 && (
                  <Badge
                    visible={true}
                    size={14}
                    allowFontScaling={false}
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -8,
                      backgroundColor: theme.colors.tertiary,
                      color: theme.colors.text,
                      fontSize: 9,
                      fontWeight: 'bold',
                      lineHeight: 14,
                    }}>
                    {count}
                  </Badge>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </TouchableRipple>
  )
}
