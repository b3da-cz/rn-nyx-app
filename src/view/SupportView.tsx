import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { ActivityIndicator, Text, TouchableRipple } from 'react-native-paper'
import { FoodPictogramComponent, SectionHeaderComponent } from '../component'
import { IapService, SUPPORT_PRODUCTS, SupportProduct, t, useTheme } from '../lib'

type Props = {
  navigation: any
}

export const SupportView: React.FC<Props> = () => {
  const theme = useTheme()
  const { colors, metrics: { fontSizes }, roundness } = theme
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
      Alert.alert(t('support.title') || 'Podpora vývoje', t('support.unavailable') || 'Položka zatím není v Google Play aktivní.')
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
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: fontSizes.p, color: colors.text, opacity: 0.9, lineHeight: 22, marginBottom: 16 }}>
          {t('support.description')}
        </Text>
        {SUPPORT_PRODUCTS.map(product => {
          const price = productPrices[product.sku] || product.approxPrice
          const isBuying = purchasingSku === product.sku
          return (
            <View
              key={product.sku}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: roundness * 2,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                marginBottom: 10,
              }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <FoodPictogramComponent name={product.icon} color={colors.primary} size={24} />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: fontSizes.h3, fontWeight: '700', color: colors.text }}>
                  {t(product.titleKey) || product.id}
                </Text>
                <Text style={{ fontSize: fontSizes.small, color: colors.faded, marginTop: 2 }}>
                  {t(product.descKey)}
                </Text>
              </View>
              <TouchableRipple
                rippleColor={colors.ripple}
                disabled={isBuying || purchasingSku !== null}
                onPress={() => handleBuy(product)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: roundness * 1.5,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 78,
                }}>
                {isBuying ? (
                  <ActivityIndicator size={16} color={btnTextColor} />
                ) : (
                  <Text style={{ fontSize: fontSizes.small, fontWeight: 'bold', color: btnTextColor }}>
                    {price}
                  </Text>
                )}
              </TouchableRipple>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
