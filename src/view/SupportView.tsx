import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper'
import { FoodPictogramComponent, SectionHeaderComponent } from '../component'
import { IapService, SUPPORT_PRODUCTS, SupportProduct, Styling, t, useTheme } from '../lib'

type Props = {
  navigation: any
}

export const SupportView: React.FC<Props> = () => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
    roundness,
  } = theme
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null)
  const [productPrices, setProductPrices] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true
    const setupIap = async () => {
      await IapService.init(
        purchase => {
          if (!mounted) return
          setPurchasingSku(null)
          Alert.alert(t('support.thankYouTitle') || 'Děkujeme!', t('support.thankYou'))
        },
        error => {
          if (!mounted) return
          setPurchasingSku(null)
        },
      )
      const items = await IapService.fetchProducts()
      if (mounted && items?.length > 0) {
        const prices: Record<string, string> = {}
        items.forEach(p => {
          if (p.localizedPrice) prices[p.productId] = p.localizedPrice
        })
        setProductPrices(prices)
      }
    }
    setupIap()
    return () => {
      mounted = false
      IapService.close()
    }
  }, [])

  const handleBuy = async (product: SupportProduct) => {
    if (!productPrices[product.sku]) {
      Alert.alert(
        t('support.title') || 'Podpora vývoje',
        t('support.unavailable') || 'Platby nejsou v tomto zařízení momentálně dostupné.',
      )
      return
    }
    try {
      setPurchasingSku(product.sku)
      await IapService.buy(product.sku)
    } catch (e: any) {
      setPurchasingSku(null)
      if (e?.code !== 'E_USER_CANCELLED') {
        Alert.alert(t('support.title') || 'Podpora vývoje', e?.message || t('support.error'))
      }
    }
  }

  const btnTextColor = theme.dark ? '#000' : '#fff'

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }}>
      <SectionHeaderComponent title={t('support.title') || 'Podpora vývoje'} backgroundColor={colors.surface} />
      <Text
        style={{
          paddingHorizontal: blocks.medium,
          paddingVertical: blocks.medium,
          color: colors.text,
          fontSize: fontSizes.p,
          lineHeight: 22,
        }}>
        {t('support.description')}
      </Text>
      <View style={{ marginBottom: blocks.large }}>
        {SUPPORT_PRODUCTS.map(product => {
          const price = productPrices[product.sku] || product.approxPrice
          const isBuying = purchasingSku === product.sku
          return (
            <TouchableRipple
              key={product.sku}
              disabled={isBuying || purchasingSku !== null}
              rippleColor={colors.ripple}
              onPress={() => handleBuy(product)}
              style={{
                backgroundColor: colors.row || colors.surface,
                borderLeftWidth: 3,
                borderColor: colors.primary,
                marginBottom: blocks.small,
                paddingHorizontal: blocks.medium,
                paddingVertical: blocks.medium,
              }}>
              <View style={[Styling.groups.flexRowSpbCentered, { minHeight: 44 }]}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: blocks.medium,
                  }}>
                  <FoodPictogramComponent name={product.icon} color={colors.primary} size={26} />
                </View>
                <View style={{ flex: 1, marginRight: blocks.medium }}>
                  <Text numberOfLines={1} style={{ fontSize: fontSizes.p, fontWeight: '700', color: colors.text }}>
                    {t(product.titleKey) || product.id}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: fontSizes.small, color: colors.faded, marginTop: 2 }}>
                    {t(product.descKey)}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: blocks.medium,
                    height: 32,
                    borderRadius: roundness,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 74,
                  }}>
                  {isBuying ? (
                    <ActivityIndicator size={16} color={btnTextColor} />
                  ) : (
                    <Text style={{ fontSize: fontSizes.small, fontWeight: 'bold', color: btnTextColor }}>
                      {price}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableRipple>
          )
        })}
      </View>
    </ScrollView>
  )
}
