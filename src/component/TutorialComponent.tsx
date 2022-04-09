import React, { useEffect, useState, useRef } from 'react'
import { View, ScrollView, LayoutAnimation } from 'react-native'
import { Text } from 'react-native-paper'
import Swipeable from 'react-native-swipeable-row'
import Icon from 'react-native-vector-icons/Feather'
import { ButtonComponent, UserIconComponent } from '../component'
import { LayoutAnimConf, Styling, t } from '../lib'

export const TutorialComponent = ({ theme, onConfirm }) => {
  const [isLeftDone, setIsLeftDone] = useState<boolean>(false)
  const [isRightDone, setIsRightDone] = useState<boolean>(false)
  const refSwiper = useRef<Swipeable>()

  useEffect(() => {
    setTimeout(() => refSwiper.current?.bounceRight(), 500)
  }, [])

  const onLeftSwipe = () => {
    if (!isRightDone) {
      setTimeout(() => refSwiper.current?.recenter(), 1000)
      setTimeout(() => refSwiper.current?.bounceRight(), 1500)
    }
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    setIsLeftDone(true)
  }

  const onRightSwipe = () => {
    if (!isLeftDone) {
      setTimeout(() => refSwiper.current?.recenter(), 1000)
      setTimeout(() => refSwiper.current?.bounceLeft(), 1500)
    }
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    setIsRightDone(true)
  }

  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ fontSize: fontSizes.h3, margin: blocks.large }}>{t('actions.swipe')}:</Text>
      <Swipeable
        onSwipeStart={e => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }}
        onLeftButtonsOpenRelease={onLeftSwipe}
        onRightButtonsOpenRelease={onRightSwipe}
        leftButtons={[
          <View style={Styling.groups.squareBtn}>
            <Icon name={'corner-down-right'} size={fontSizes.h2} color={colors.text} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'copy'} size={fontSizes.h2} color={colors.text} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'share'} size={fontSizes.h2} color={colors.text} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'bell'} size={fontSizes.h2} color={colors.text} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'trash-2'} size={fontSizes.h2} color={'red'} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'alert-triangle'} size={fontSizes.h2} color={'red'} />
          </View>,
        ]}
        leftButtonContainerStyle={{ alignItems: 'flex-end' }}
        leftButtonWidth={50}
        rightButtonWidth={50}
        rightButtons={[
          <View style={Styling.groups.squareBtn}>
            <Icon name={'thumbs-up'} size={fontSizes.h2} color={'green'} />
          </View>,
          <View style={Styling.groups.squareBtn}>
            <Icon name={'thumbs-down'} size={fontSizes.h2} color={'red'} />
          </View>,
        ]}
        rightButtonContainerStyle={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}
        disable={false}
        onRef={ref => (refSwiper.current = ref)}>
        <View
          style={{
            height: 50,
            backgroundColor: colors.tertiary,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 5,
          }}>
          <UserIconComponent username={'NYX'} marginRight={10} />
          <View style={{ justifyContent: 'center' }}>
            <Text>Swipe me!</Text>
            <Text style={{ fontSize: fontSizes.small }}>
              {isRightDone ? (isLeftDone ? '<----   /   ---->' : '---->') : '<----'}
            </Text>
          </View>
        </View>
      </Swipeable>
      {!isRightDone && !isLeftDone && (
        <Text style={{ padding: blocks.medium }}>
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Maecenas libero. Mauris metus. Vestibulum fermentum
          tortor id mi. Etiam commodo dui eget wisi. Maecenas ipsum velit, consectetuer eu lobortis ut, dictum at dui.
          In convallis. Fusce aliquam vestibulum ipsum. Integer tempor. Fusce suscipit libero eget elit.
        </Text>
      )}
      <ScrollView style={{ backgroundColor: colors.background }}>
        <View style={{ marginVertical: 10 }} />
        {isRightDone && (
          <View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'thumbs-up'} size={fontSizes.h2} color={'green'} />
              </View>
              <Text>{t('actions.rateUp')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'thumbs-down'} size={fontSizes.h2} color={'red'} />
              </View>
              <Text>{t('actions.rateDown')}</Text>
            </View>
          </View>
        )}
        {isLeftDone && (
          <View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'corner-down-right'} size={fontSizes.h2} color={colors.text} />
              </View>
              <Text>{t('actions.reply')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'copy'} size={fontSizes.h2} color={colors.text} />
              </View>
              <Text>{t('actions.copy')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'share'} size={fontSizes.h2} color={colors.text} />
              </View>
              <Text>{t('actions.share')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'bell'} size={fontSizes.h2} color={colors.text} />
              </View>
              <Text>{t('actions.remind')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'trash-2'} size={fontSizes.h2} color={'red'} />
              </View>
              <Text>{t('actions.delete')}</Text>
            </View>
            <View style={Styling.groups.flexRowCentered}>
              <View style={[Styling.groups.squareBtn, Styling.groups.squareBtnBorder, { borderColor: colors.faded }]}>
                <Icon name={'alert-triangle'} size={fontSizes.h2} color={'red'} />
              </View>
              <Text>{t('actions.report')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {isLeftDone && isRightDone && (
        <View>
          <ButtonComponent
            label={t('actions.complete')}
            width={'100%'}
            theme={theme}
            fontSize={fontSizes.h2}
            onPress={() => onConfirm()}
          />
        </View>
      )}
    </View>
  )
}
