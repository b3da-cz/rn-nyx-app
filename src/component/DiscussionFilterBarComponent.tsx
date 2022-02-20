import React, { useState } from 'react'
import { LayoutAnimation, Platform, ScrollView, View } from 'react-native'
import { IconButton, Text, TextInput, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { ButtonComponent, LoaderComponent, UserRowComponent } from '../component'
import { LayoutAnimConf, Nyx, Styling, t, useTheme, wait } from '../lib'

type Props = {
  discussionTitle: string
  nyx: Nyx
  onFilter: Function
  onBack: Function
}
export const DiscussionFilterBarComponent = ({ discussionTitle, nyx, onFilter, onBack }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [user, setUser] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [usernameToFind, setUsernameToFind] = useState('')

  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(!isOpen)
  }
  const closeFilter = async () => {
    await wait(200)
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(false)
  }
  const setFilter = () => {
    onFilter({ user, text, rating })
    closeFilter()
  }
  const clearFilter = () => {
    setText('')
    setUser('')
    setUsernameToFind('')
    setUsers([])
    setRating(0)
    onFilter({ user: '', text: '', rating: 0 })
    closeFilter()
  }
  const searchUsername = async phrase => {
    setUsernameToFind(phrase)
    setIsFetching(true)
    const res = await nyx.api.search(phrase, false, true)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    if (res?.exact) {
      setUsers([...res.exact, ...(res.friends || []), ...(res.others || [])])
    } else if (!phrase || phrase?.length === 0) {
      setUsers([])
    }
    setIsFetching(false)
  }
  const pickUser = username => {
    setUser(username)
    setUsernameToFind(username)
    setUsers([])
  }

  return (
    <View style={Styling.groups.flexRowSpbCentered}>
      <TouchableRipple
        rippleColor={colors.ripple}
        style={[
          Styling.groups.shadow,
          {
            backgroundColor: colors.background,
            position: Platform.OS === 'android' || !isOpen ? 'absolute' : 'static',
            top: 0,

            right: 0,
            zIndex: 1,
            width: '100%',
            marginBottom: Platform.OS === 'android' ? blocks.small : -50,
            height: isOpen ? 'auto' : 50,
          },
        ]}
        onPress={() => toggleFilter()}>
        <View>
          <View style={Styling.groups.flexRowSpbCentered}>
            <IconButton
              icon={'arrow-left'}
              size={25}
              style={{ marginLeft: 10 }}
              color={colors.primary}
              onPress={() => onBack()}
              rippleColor={colors.ripple}
            />
            <Text
              style={{ fontSize: fontSizes.p + 2, maxWidth: '70%', marginRight: 'auto', marginLeft: blocks.large }}
              numberOfLines={1}>
              {discussionTitle}
            </Text>
            <Icon
              name={'search'}
              size={20}
              style={{ marginRight: 10 }}
              color={rating !== 0 || user?.length || text?.length ? colors.accent : colors.text}
            />
          </View>
          {isOpen && (
            <View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: '50%' }}>
                  <TextInput
                    numberOfLines={1}
                    textAlignVertical={'center'}
                    selectionColor={colors.primary}
                    onChangeText={val => searchUsername(val)}
                    value={`${usernameToFind}`}
                    placeholder={'ID'}
                    style={{
                      marginBottom: 3,
                      height: 42,
                      backgroundColor: 'inherit',
                    }}
                  />
                </View>
                <View style={{ width: '50%' }}>
                  <TextInput
                    numberOfLines={1}
                    textAlignVertical={'center'}
                    selectionColor={colors.primary}
                    onChangeText={val => setText(val)}
                    value={`${text}`}
                    placeholder={'Text'}
                    style={{
                      marginBottom: 3,
                      height: 42,
                      backgroundColor: 'inherit',
                    }}
                  />
                </View>
              </View>
              <ScrollView
                keyboardDismissMode={'on-drag'}
                keyboardShouldPersistTaps={'always'}
                style={{ maxHeight: '55%' }}>
                {isFetching && <LoaderComponent />}
                {users?.length > 0 &&
                  users.map(u => <UserRowComponent key={u.username} user={u} onPress={() => pickUser(u.username)} />)}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ButtonComponent
                  label={'-50'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating - 50)}
                />
                <ButtonComponent
                  label={'-10'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating - 10)}
                />
                <ButtonComponent
                  label={'-1'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating - 1)}
                />
                <TextInput
                  numberOfLines={1}
                  textAlignVertical={'center'}
                  selectionColor={colors.primary}
                  onChangeText={val => setRating(isNaN(Number(val)) ? 0 : Number(val))}
                  value={`${rating}`}
                  placeholder={'Rating'}
                  style={{
                    marginBottom: 3,
                    height: 42,
                    textAlign: 'center',
                    backgroundColor: 'inherit',
                  }}
                />
                <ButtonComponent
                  label={'+1'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating + 1)}
                />
                <ButtonComponent
                  label={'+10'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating + 10)}
                />
                <ButtonComponent
                  label={'+50'}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={screen.width / 8}
                  onPress={() => setRating(rating + 50)}
                />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ButtonComponent
                  label={t('search.clear')}
                  color={colors.faded}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={'50%'}
                  onPress={() => clearFilter()}
                />
                <ButtonComponent
                  label={t('search.do')}
                  color={colors.accent}
                  backgroundColor={'inherit'}
                  fontSize={fontSizes.p}
                  width={'50%'}
                  onPress={() => setFilter()}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableRipple>
    </View>
  )
}
